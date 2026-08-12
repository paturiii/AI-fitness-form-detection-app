from fastapi import APIRouter, Depends, HTTPException, Query
from ..dependencies import get_current_user, get_history
from ..schemas import HistoryUpdate
from ..supabase_client import supabase_admin

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
        "history": history,
        "has_more": len(history) == limit,
    }


@router.put("/{entry_id}")
async def update_history_entry(
    entry_id: str,
    entry: HistoryUpdate,
    user: dict = Depends(get_current_user),
):
    res = (
        supabase_admin.table("history")
        .update({
            "muscle_group": entry.muscle_group,
            "exercises": entry.exercises,
            "date": entry.date,
        })
        .eq("id", entry_id)
        .eq("user_id", user["id"])
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to update workout")

    return {"message": "Workout updated", "data": res.data}


@router.delete("/{entry_id}")
async def delete_history_entry(entry_id: str, user: dict = Depends(get_current_user)):
    res = (
        supabase_admin.table("history")
        .delete()
        .eq("id", entry_id)
        .eq("user_id", user["id"])
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to delete workout")

    return {"message": "Workout deleted"}
