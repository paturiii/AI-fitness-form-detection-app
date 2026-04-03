from fastapi import APIRouter, Depends
from ..dependencies import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/")
async def get_settings(user: dict = Depends(get_current_user)):
    return {
        "screen": "settings",
        "user": user,
    }
