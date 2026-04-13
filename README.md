# 🏋️‍♂️ Accountable Workout

**Accountable Workout** is a mobile application that helps gym-goers improve exercise form by analyzing recorded workout videos and identifying **bad reps** (e.g. incomplete range of motion, asymmetry, poor depth).

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
│   │   ├── main.py                 # FastAPI entry point
│   │   ├── supabase_client.py      # Supabase client init
│   │   ├── dependencies.py         # Auth dependency (token validation)
│   │   ├── schemas.py              # Pydantic models
│   │   └── routes/
│   │       ├── auth_routes.py      # /auth/signup, /auth/login, /auth/logout, /auth/me
│   │       ├── home_routes.py      # /home/
│   │       ├── profile_routes.py   # /profile/
│   │       ├── settings_routes.py  # /settings/
│   │       └── wokout_routes.py    # /workouts/upload
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── App.tsx
    └── src/
        ├── context/AuthContext.tsx
        ├── services/api.ts
        ├── navigation/
        │   ├── RootNavigator.tsx  # Auth guard: shows AuthStack or AppTabs
        │   ├── AuthStack.tsx      # Login → Signup
        │   └── AppTabs.tsx        # Home | Profile | Settings
        └── screens/
            ├── auth/
            │   ├── LoginScreen.tsx
            │   └── SignupScreen.tsx
            ├── home
            │   ├── Edit.tsx
            │   ├── HomeScreen.tsx
            │   └── HomeScreenStack.tsx
            ├── profile
            │   └── ProfileScreen.tsx
            ├── settings
            │   └── SettingsScreen.tsx
            └── workout
                ├── NewWorkout.tsx
                ├── StartWorkout.tsx
                ├── WorkoutScreen.tsx
                └── WorkoutStack.tsx
```

---

### Frontend (Mobile)
- **React Native (Expo)**
- **TypeScript**
- `expo-camera`, `expo-av`
- **TanStack Query**
- **Axios**
- Minimal UI-first design (function > aesthetics)

---

### Backend
- **Python**
- **FastAPI**
- **Uvicorn**
- **PostgreSQL**
- **Supabase** (video storage)

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

## Frontend Setup

```bash
cd frontend
npm install

# Start Expo
npx expo start
```

### API URL Configuration

Edit `frontend/src/services/api.ts` and set the `API_URL`:

- **Android Emulator**: `http://10.0.2.2:8000`
- **iOS Simulator**: `http://localhost:8000`
- **Physical device**: Use your computer's local IP, e.g. `http://192.168.1.x:8000`