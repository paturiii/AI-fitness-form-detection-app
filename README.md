# Auth App

Full-stack authentication app: **FastAPI** backend + **React Native (Expo)** frontend, powered by **Supabase** auth.

The backend handles all authentication logic. The frontend is purely visual and calls the backend for everything.

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── supabase_client.py   # Supabase client init
│   │   ├── dependencies.py      # Auth dependency (token validation)
│   │   ├── schemas.py           # Pydantic models
│   │   └── routes/
│   │       ├── auth_routes.py   # /auth/signup, /auth/login, /auth/logout, /auth/me
│   │       ├── home_routes.py   # /home/ (protected)
│   │       ├── profile_routes.py# /profile/ (protected)
│   │       └── settings_routes.py# /settings/ (protected)
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
            ├── LoginScreen.tsx
            ├── SignupScreen.tsx
            ├── HomeScreen.tsx
            ├── ProfileScreen.tsx
            └── SettingsScreen.tsx
```

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

API docs will be at: http://localhost:8000/docs

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

## API Endpoints

| Method | Path            | Auth Required | Description         |
|--------|-----------------|---------------|---------------------|
| POST   | /auth/signup    | No            | Create new account  |
| POST   | /auth/login     | No            | Log in              |
| POST   | /auth/logout    | Yes           | Log out             |
| GET    | /auth/me        | Yes           | Get current user    |
| GET    | /home/          | Yes           | Home tab data       |
| GET    | /profile/       | Yes           | Profile tab data    |
| GET    | /settings/      | Yes           | Settings tab data   |
| GET    | /health         | No            | Health check        |
