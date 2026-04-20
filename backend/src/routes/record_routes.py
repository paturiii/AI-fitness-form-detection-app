from re import L
from fastapi import APIRouter, Depends, HTTPException
import supabase

from ..schemas import WorkoutUpload, WorkoutSplitUpdate
from ..supabase_client import supabase_admin
from ..dependencies import get_current_user, get_workouts

router = APIRouter(prefix="/record", tags=["record"])

@router.get("/")
def record_screen():
    pass