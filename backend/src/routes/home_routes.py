from fastapi import APIRouter, Depends
from ..dependencies import get_current_user, get_history

router = APIRouter(prefix="/home", tags=["home"])


@router.get("/")
async def get_home(user: dict = Depends(get_current_user), history: list = Depends(get_history)):

    return {
        "screen": "home",
        "message": f"Welcome back, {user.get('first_name') or user['email']}!",
        "user": user,
        'history': history
    }
