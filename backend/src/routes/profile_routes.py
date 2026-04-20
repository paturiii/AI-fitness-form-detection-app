from fastapi import APIRouter, Depends
from ..supabase_client import supabase_admin
from ..dependencies import get_current_user
from collections import defaultdict

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/")
async def get_profile(user: dict = Depends(get_current_user)):
    return {
        "screen": "profile",
        "user": user,
    }

@router.get("/monthly-count")
def get_entries(user: dict = Depends(get_current_user)):
    res = (
        supabase_admin.table("history")
        .select("date")
        .eq("user_id", user["id"])
        .execute()
    )
    counts = defaultdict(int)
    for row in res.data:
        month = row["date"][:7]
        counts[month] += 1
    return {"monthly_counts": dict(counts)}