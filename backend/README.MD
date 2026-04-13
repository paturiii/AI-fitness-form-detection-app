```
backend/
├── src/
│   ├── main.py                 # FastAPI entry point
│   ├── supabase_client.py      # Supabase client init
│   ├── dependencies.py         # Auth dependency (token validation)
│   ├── schemas.py              # Pydantic models
│   └── routes/
│       ├── auth_routes.py      # /auth/signup, /auth/login, /auth/logout, /auth/me
│       ├── home_routes.py      # /home/
│       ├── profile_routes.py   # /profile/
│       ├── settings_routes.py  # /settings/
│       └── wokout_routes.py    # /workouts/upload
├── requirements.txt
└── .env.example
```

