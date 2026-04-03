from fastapi import APIRouter, Depends
from ..dependencies import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/")
async def get_profile(user: dict = Depends(get_current_user)):
    return {
        "screen": "profile",
        "user": user,
    }
