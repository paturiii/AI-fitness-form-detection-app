from fastapi import APIRouter, Depends, Query
from ..dependencies import get_current_user, get_history

router = APIRouter(prefix="/history", tags=["history"])

PAGE_SIZE = 20


@router.get("/")
async def history_endpoint(
    user: dict = Depends(get_current_user),
    offset: int = Query(0, ge=0),
    limit: int = Query(PAGE_SIZE, ge=1, le=100),
):
    history = await get_history(user, offset=offset, limit=limit)

    return {
        "screen": "history",
        "message": f"Welcome back, {user.get('first_name') or user['email']}!",
        "user": user,
        "history": history,
        "has_more": len(history) == limit,
    }
