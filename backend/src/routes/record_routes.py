import os
import shutil
import tempfile
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse

from ..analytics.pose_detection.push_ups import analyze_pushups
from ..dependencies import get_current_user

router = APIRouter(prefix="/record", tags=["record"])

# Annotated videos are written here and served from /record/video/{id}.
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = _BACKEND_ROOT / "processed_videos"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


_ANALYZERS = {
    "push_up": analyze_pushups,
}


@router.post("/upload-video")
async def upload_video(
    exercise: str = Query(..., description="Exercise key, e.g. 'push_up'"),
    video: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    analyzer = _ANALYZERS.get(exercise)
    if analyzer is None:
        raise HTTPException(
            status_code=400,
            detail=f"Analysis for exercise '{exercise}' is not implemented yet.",
        )

    suffix = Path(video.filename or "upload.mp4").suffix or ".mp4"
    tmp_input = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    try:
        try:
            shutil.copyfileobj(video.file, tmp_input)
        finally:
            tmp_input.close()

        analysis_id = uuid.uuid4().hex
        output_path = PROCESSED_DIR / f"{analysis_id}.mp4"

        try:
            summary = analyzer(tmp_input.name, str(output_path))
        except FileNotFoundError as e:
            # Most likely the MediaPipe model file is missing.
            raise HTTPException(status_code=500, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")
    finally:
        try:
            os.unlink(tmp_input.name)
        except OSError:
            pass

    return {
        "analysis_id": analysis_id,
        "video_url": f"/record/video/{analysis_id}",
        "summary": summary,
    }


@router.get("/video/{analysis_id}")
async def get_annotated_video(analysis_id: str):
    # Guard against path traversal — only accept bare hex ids.
    if not analysis_id.isalnum():
        raise HTTPException(status_code=400, detail="Invalid analysis id")

    path = PROCESSED_DIR / f"{analysis_id}.mp4"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Annotated video not found")

    return FileResponse(path, media_type="video/mp4", filename=f"{analysis_id}.mp4")
