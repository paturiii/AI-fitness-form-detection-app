# 🏋️‍♂️ SmartForm

**SmartForm** is a mobile application that helps gym-goers improve exercise form by analyzing recorded workout videos and identifying **bad reps** (e.g. incomplete range of motion, asymmetry, poor depth).

Unlike generic fitness apps, SmartForm focuses on **objective, explainable feedback** using pose estimation and biomechanical rules — not vague “AI scores”.

---

## 🚨 Problem

Most beginners (and many intermediates) perform exercises with poor form due to:
- Lack of coaching
- No immediate feedback
- No objective way to review reps

Bad form leads to:
- Slower progress
- Increased injury risk
- Reinforcing incorrect movement patterns

---

## ✅ Solution

SmartForm allows users to:
1. Record workout videos
2. Automatically detect reps
3. Classify reps as good or bad
4. Explain *why* a rep is bad
5. Track workouts and estimated calorie burn

Feedback is generated using **pose estimation + rule-based biomechanics**, ensuring transparency and debuggability.

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── main.py
│   │   ├── dependencies.py
│   │   ├── supabase_client.py
│   │   ├── schemas.py
│   │   ├── analytics/
│   │   │   └── pose_detection/   # push_ups.py, deadlifts.py, ...
│   │   └── routes/               # auth, history, profile, record, settings, workout
│   ├── models/                   # MediaPipe .task files (gitignored, see setup)
│   ├── processed_videos/         # transient annotated outputs (auto-cleaned)
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── App.tsx
    └── src/
        ├── components/
        ├── context/
        ├── hooks/
        ├── services/             # api.ts, values.ts
        ├── navigation/
        └── screens/
            ├── auth/
            ├── history/
            ├── profile/
            ├── record/
            └── workout/
```

---

### Frontend (Mobile)
- **React Native (Expo SDK 55)**
- **TypeScript**
- `expo-image-picker` (record / pick workout videos)
- `expo-video` (playback of analyzed clips)
- `expo-secure-store` (auth token storage)
- **TanStack Query**
- Native `fetch` (see `src/services/api.ts`)
- Minimal UI-first design (function > aesthetics)

---

### Backend
- **Python**
- **FastAPI** + **Uvicorn**
- **Supabase** (auth + Postgres tables: `profile`, `history`, `workout_split`, ...)
- Uploaded videos are analyzed in a temp file and **never persisted long-term** — the annotated MP4 is streamed back to the client once and then deleted.

---

### Computer Vision & Analysis
- **MediaPipe Pose**
- **NumPy**
- **OpenCV**
- **Pandas**
- **scikit-learn** (future classification layer)

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
  - `Project URL` → `SUPABASE_URL`
  - `anon public` key → `SUPABASE_KEY`
3. (Optional) Disable email confirmation under **Auth → Settings → Email** to make signup instant during development

## Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env from the example
cp .env.example .env
# Fill in your Supabase credentials in .env

# Run the server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

API docs will be at: [http://localhost:8000/docs](http://localhost:8000/docs)

Install the [MediaPipe pose landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/python) **heavy** task file and place it at:

```
backend/models/pose_landmarker_heavy.task
```

The push-up analyzer will refuse to start if this file is missing.

## Frontend Setup

```bash
cd frontend
npm install

# Start Expo
npx expo start
```

The first launch will prompt for camera, microphone, and photo-library permissions (configured in `app.json` via the `expo-image-picker` plugin) — all three are needed for record + library upload.

### API URL Configuration

Edit `frontend/src/services/api.ts` and set the `API_URL`:

- **Android Emulator**: `http://10.0.2.2:8000`
- **iOS Simulator**: `http://localhost:8000`
- **Physical device**: Use your computer's local IP, e.g. `http://192.168.1.x:8000`

---

## How Form Analysis Works

1. The user picks or records a workout video in `RecordScreen` (`expo-image-picker`).
2. The clip is sent as multipart `POST /record/upload-video?exercise=push_up`.
3. The backend writes the upload to a temp file, runs the per-exercise analyzer in `backend/src/analytics/pose_detection/` (currently `push_ups.py` — MediaPipe pose landmarker + a rule-based rep state machine), and produces an annotated MP4 with skeleton overlays and per-rep `GOOD` / `BAD` verdicts.
4. The response is JSON: `{ analysis_id, video_url, summary: { good_reps, bad_reps, total_reps, reps: [...] } }`.
5. The frontend streams the annotated clip from `GET /record/video/{analysis_id}` into an `expo-video` `VideoView` and renders the rep-by-rep breakdown underneath.

### `/record` API

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/record/upload-video?exercise=<key>` | Multipart `video=<file>`. Bearer-authed. Currently supports `exercise=push_up`. |
| `GET`  | `/record/video/{analysis_id}` | One-shot stream of the annotated MP4; the file is removed from disk once playback finishes. |

### Filming guidelines (push-ups)

- Film the **right side** of the body in landscape — the analyzer tracks the right-side landmarks only.
- Keep the whole body in frame from shoulder to ankle.
- Single subject per clip. Recordings from `RecordScreen` are capped at 60 seconds.