"""Push-up form analysis.

Provides `analyze_pushups(input_video_path, output_video_path)` which:
  - reads a recorded push-up video,
  - detects per-frame pose with MediaPipe,
  - runs a rep-by-rep form check,
  - writes an annotated video to `output_video_path` with skeleton overlays
    and per-rep GOOD/BAD verdicts (same look as the original live tool),
  - returns a JSON-serializable summary of the reps.
"""

from __future__ import annotations

import math
import os
from pathlib import Path
from typing import Optional

import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# =========================================================
# MODEL PATH RESOLUTION
# =========================================================
# Resolve the pose-landmarker model relative to the backend root so the API
# works regardless of the process CWD. Drop the model file at
# `backend/models/pose_landmarker_heavy.task`.

_BACKEND_ROOT = Path(__file__).resolve().parents[3]
_DEFAULT_MODEL_PATH = _BACKEND_ROOT / "models" / "pose_landmarker_heavy.task"


def _resolve_model_path(override: Optional[str] = None) -> str:
    candidate = Path(override) if override else _DEFAULT_MODEL_PATH
    if not candidate.exists():
        raise FileNotFoundError(
            f"Pose landmarker model not found at {candidate}. "
            "Download `pose_landmarker_heavy.task` from MediaPipe and place it "
            f"at {_DEFAULT_MODEL_PATH}."
        )
    return str(candidate)


# =========================================================
# LANDMARK INDEXES (RIGHT SIDE)
# =========================================================

RIGHT_SHOULDER = 12
RIGHT_ELBOW = 14
RIGHT_WRIST = 16
RIGHT_HIP = 24
RIGHT_KNEE = 26
RIGHT_ANKLE = 28

IMPORTANT_LANDMARKS = [
    RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST,
    RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE,
]

CONNECTIONS = [
    (RIGHT_SHOULDER, RIGHT_ELBOW),
    (RIGHT_ELBOW, RIGHT_WRIST),
    (RIGHT_SHOULDER, RIGHT_HIP),
    (RIGHT_HIP, RIGHT_KNEE),
    (RIGHT_KNEE, RIGHT_ANKLE),
]

# =========================================================
# THRESHOLDS  (tune to taste)
# =========================================================

ELBOW_DOWN_THRESHOLD = 140   # rep enters "down" state once arm bends past this
ELBOW_UP_THRESHOLD = 160     # arm is "up" when elbow angle >=
TARGET_DEPTH = 95            # rep is "deep enough" if min elbow <=

BACK_STRAIGHT_MIN = 160      # shoulder-hip-ankle angle below this = bent back
PIKE_OFFSET_RATIO = 0.04     # |hip_y - line| / h above which the bend is flagged

SHOULDER_FLARE_MAX = 75      # hip-shoulder-elbow above this = flaring

BODY_HORIZONTAL_RATIO = 0.35  # |shoulder_y - hip_y| / h must be <


# =========================================================
# ANGLE HELPER
# =========================================================

def calculate_angle(a, b, c) -> int:
    """Interior angle (degrees) at point b, formed by rays b->a and b->c."""
    ax, ay = a
    bx, by = b
    cx, cy = c

    ba = (ax - bx, ay - by)
    bc = (cx - bx, cy - by)

    dot = ba[0] * bc[0] + ba[1] * bc[1]
    mag_ba = math.sqrt(ba[0] ** 2 + ba[1] ** 2)
    mag_bc = math.sqrt(bc[0] ** 2 + bc[1] ** 2)

    if mag_ba == 0 or mag_bc == 0:
        return 0

    cos_angle = max(-1.0, min(1.0, dot / (mag_ba * mag_bc)))
    return int(math.degrees(math.acos(cos_angle)))


def _label(frame, text, point, offset=(10, 0)) -> None:
    cv2.putText(
        frame,
        text,
        (point[0] + offset[0], point[1] + offset[1]),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2,
    )


def _rep_to_json(rep: dict) -> dict:
    return {
        "rep_number": rep["rep_number"],
        "start_frame": rep["start_frame"],
        "end_frame": rep["end_frame"],
        "min_elbow": rep["min_elbow"],
        "min_back": rep["min_back"],
        "max_back": rep["max_back"],
        "good": rep["good"],
        "issues": list(rep["issues"]),
    }


# =========================================================
# PUBLIC ANALYZER
# =========================================================

def analyze_pushups(
    input_video_path: str,
    output_video_path: str,
    model_path: Optional[str] = None,
) -> dict:
    """Analyze a push-up video and write an annotated copy.

    Returns a summary dict:
        {
            "fps": float,
            "frame_count": int,
            "total_reps": int,
            "good_reps": int,
            "bad_reps": int,
            "reps": [ { rep_number, start_frame, end_frame, min_elbow,
                        min_back, max_back, good, issues: [...] }, ... ],
        }
    """

    if not os.path.exists(input_video_path):
        raise FileNotFoundError(f"Input video not found: {input_video_path}")

    resolved_model = _resolve_model_path(model_path)

    base_options = python.BaseOptions(model_asset_path=resolved_model)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        num_poses=1,
    )
    detector = vision.PoseLandmarker.create_from_options(options)

    cap = cv2.VideoCapture(input_video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {input_video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Write H.264-friendly mp4 so it streams in mobile players.
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    os.makedirs(os.path.dirname(os.path.abspath(output_video_path)), exist_ok=True)
    writer = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

    reps: list[dict] = []
    current_rep: Optional[dict] = None
    pushup_state = "up"
    timestamp_ms = 0
    frame_idx = 0

    # First pass: detect + record per-frame analysis into `reps`, and stash
    # each frame's drawing data so we can paint the GOOD/BAD verdict during
    # the same pass-through write (one decode/encode cycle).
    per_frame_overlay: list[dict] = []

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            h, w = frame.shape[:2]
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            result = detector.detect_for_video(mp_image, timestamp_ms)

            overlay: dict = {"landmarks": None}

            if result.pose_landmarks:
                landmarks = result.pose_landmarks[0]
                points = {}
                for idx in IMPORTANT_LANDMARKS:
                    lm = landmarks[idx]
                    points[idx] = (int(lm.x * w), int(lm.y * h))

                shoulder = points[RIGHT_SHOULDER]
                elbow = points[RIGHT_ELBOW]
                wrist = points[RIGHT_WRIST]
                hip = points[RIGHT_HIP]
                knee = points[RIGHT_KNEE]
                ankle = points[RIGHT_ANKLE]

                elbow_angle = calculate_angle(shoulder, elbow, wrist)
                back_angle = calculate_angle(shoulder, hip, ankle)
                shoulder_angle = calculate_angle(hip, shoulder, elbow)
                knee_angle = calculate_angle(hip, knee, ankle)

                body_horizontal = abs(shoulder[1] - hip[1]) < (h * BODY_HORIZONTAL_RATIO)

                overlay = {
                    "landmarks": points,
                    "elbow_angle": elbow_angle,
                    "back_angle": back_angle,
                    "knee_angle": knee_angle,
                    "pushup_state": pushup_state,
                }

                if body_horizontal:
                    if pushup_state == "up" and elbow_angle <= ELBOW_DOWN_THRESHOLD:
                        pushup_state = "down"
                        current_rep = {
                            "rep_number": len(reps) + 1,
                            "start_frame": frame_idx,
                            "end_frame": frame_idx,
                            "min_elbow": elbow_angle,
                            "min_back": back_angle,
                            "max_back": back_angle,
                            "issues": set(),
                        }

                    if pushup_state == "down" and current_rep is not None:
                        current_rep["min_elbow"] = min(current_rep["min_elbow"], elbow_angle)
                        current_rep["min_back"] = min(current_rep["min_back"], back_angle)
                        current_rep["max_back"] = max(current_rep["max_back"], back_angle)

                        if back_angle < BACK_STRAIGHT_MIN:
                            dx = ankle[0] - shoulder[0]
                            if dx != 0:
                                t = (hip[0] - shoulder[0]) / dx
                                line_y = shoulder[1] + t * (ankle[1] - shoulder[1])
                            else:
                                line_y = (shoulder[1] + ankle[1]) / 2
                            hip_offset = hip[1] - line_y
                            if abs(hip_offset) > h * PIKE_OFFSET_RATIO:
                                if hip_offset > 0:
                                    current_rep["issues"].add("Hips sagging (back not straight)")
                                else:
                                    current_rep["issues"].add("Hips piking up (back not straight)")
                        if shoulder_angle > SHOULDER_FLARE_MAX:
                            current_rep["issues"].add("Elbows flaring out from torso")

                        if elbow_angle >= ELBOW_UP_THRESHOLD:
                            pushup_state = "up"
                            current_rep["end_frame"] = frame_idx

                            if current_rep["min_elbow"] > TARGET_DEPTH:
                                current_rep["issues"].add(
                                    f"Didn't go deep enough (min elbow {current_rep['min_elbow']}°)"
                                )

                            current_rep["good"] = len(current_rep["issues"]) == 0
                            reps.append(current_rep)
                            current_rep = None

                overlay["pushup_state"] = pushup_state

            per_frame_overlay.append(overlay)
            frame_idx += 1
            timestamp_ms += int(1000 / fps)
    finally:
        cap.release()

    # Close any rep still in progress at end-of-video so it shows in the replay.
    if current_rep is not None:
        current_rep["end_frame"] = max(0, frame_idx - 1)
        if current_rep["min_elbow"] > TARGET_DEPTH:
            current_rep["issues"].add(
                f"Didn't go deep enough (min elbow {current_rep['min_elbow']}°)"
            )
        current_rep["good"] = len(current_rep["issues"]) == 0
        reps.append(current_rep)

    # Build a lookup so each frame knows what rep (if any) it belongs to.
    rep_by_frame: dict[int, dict] = {}
    for r in reps:
        for f in range(r["start_frame"], r["end_frame"] + 1):
            rep_by_frame[f] = r

    # Second pass: re-open the source video and write the annotated output
    # using the cached per-frame overlay + the now-finalized rep verdicts.
    cap = cv2.VideoCapture(input_video_path)
    try:
        idx = 0
        while True:
            success, frame = cap.read()
            if not success:
                break

            overlay = per_frame_overlay[idx] if idx < len(per_frame_overlay) else {"landmarks": None}
            h, w = frame.shape[:2]

            points = overlay.get("landmarks")
            if points:
                for lm_idx in IMPORTANT_LANDMARKS:
                    cv2.circle(frame, points[lm_idx], 6, (0, 255, 0), -1)
                for s_idx, e_idx in CONNECTIONS:
                    cv2.line(frame, points[s_idx], points[e_idx], (255, 0, 0), 3)

                _label(frame, f"Elbow: {overlay['elbow_angle']}", points[RIGHT_ELBOW])
                _label(frame, f"Back: {overlay['back_angle']}", points[RIGHT_HIP])
                _label(frame, f"Knee: {overlay['knee_angle']}", points[RIGHT_KNEE], offset=(10, 20))

                state = overlay["pushup_state"]
                state_color = (0, 255, 255) if state == "down" else (0, 200, 0)
                cv2.putText(
                    frame,
                    state.upper(),
                    (points[RIGHT_ELBOW][0] + 10, points[RIGHT_ELBOW][1] + 25),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    state_color,
                    2,
                )

            # Bottom strip with rep verdict.
            strip = frame.copy()
            cv2.rectangle(strip, (0, h - 120), (w, h), (0, 0, 0), -1)
            cv2.addWeighted(strip, 0.55, frame, 0.45, 0, frame)

            rep = rep_by_frame.get(idx)
            if rep is not None:
                color = (0, 200, 0) if rep["good"] else (0, 0, 255)
                verdict = "GOOD" if rep["good"] else "BAD"
                cv2.putText(
                    frame,
                    f"Rep #{rep['rep_number']}  --  {verdict}",
                    (15, h - 85),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.95,
                    color,
                    2,
                )
                for i, issue in enumerate(sorted(rep["issues"])[:2]):
                    cv2.putText(
                        frame,
                        f"- {issue}",
                        (15, h - 55 + i * 24),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.55,
                        (255, 255, 255),
                        1,
                    )
                stats = (
                    f"min elbow {rep['min_elbow']}°   "
                    f"back range {rep['min_back']}-{rep['max_back']}°"
                )
                cv2.putText(
                    frame,
                    stats,
                    (15, h - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.45,
                    (200, 200, 200),
                    1,
                )
            else:
                cv2.putText(
                    frame,
                    "Between reps",
                    (15, h - 50),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (180, 180, 180),
                    2,
                )

            # Persistent HUD: good/bad totals so far.
            good_so_far = sum(1 for r in reps if r["end_frame"] <= idx and r["good"])
            bad_so_far = sum(1 for r in reps if r["end_frame"] <= idx and not r["good"])
            cv2.rectangle(frame, (10, 10), (340, 60), (0, 0, 0), -1)
            cv2.putText(
                frame,
                f"Good: {good_so_far}   Bad: {bad_so_far}",
                (20, 45),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (0, 255, 0),
                2,
            )

            writer.write(frame)
            idx += 1
    finally:
        cap.release()
        writer.release()

    good_reps = sum(1 for r in reps if r["good"])
    return {
        "fps": fps,
        "frame_count": frame_idx,
        "total_reps": len(reps),
        "good_reps": good_reps,
        "bad_reps": len(reps) - good_reps,
        "reps": [_rep_to_json(r) for r in reps],
    }
