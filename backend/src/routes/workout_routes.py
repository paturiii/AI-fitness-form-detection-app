from fastapi import APIRouter, Depends, HTTPException

from ..schemas import WorkoutUpload
from ..supabase_client import supabase_admin
from ..dependencies import get_current_user, get_workouts

router = APIRouter(prefix="/workouts", tags=["workouts"])

@router.get("/")
async def get_workout_list(user: dict = Depends(get_current_user), workouts: list = Depends(get_workouts)):
    return {
        "screen": "workouts",
        "user": user,
        "message": f"Your Workout Splits",
        "workout": workouts,
    }

@router.post("/upload")
async def upload_workout(
    workout: WorkoutUpload,
    user: dict = Depends(get_current_user)):

    res = supabase_admin.table('history').insert({
        "user_id": user['id'],
        "exercises": workout.exercises,
        "muscle_group": workout.muscle_group,
        "date": workout.date
    }).execute()

    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to insert workout")
    
    return {"message": "Workout uploaded", "data": res.data}
