from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth_routes, home_routes, profile_routes, settings_routes
from fastapi import APIRouter, Depends
from . dependencies import get_current_user, get_history

app = FastAPI(title="Accountable Workout")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(home_routes.router)
app.include_router(profile_routes.router)
app.include_router(settings_routes.router)


@app.get("/")
async def health():
    return {"status": "ok"}