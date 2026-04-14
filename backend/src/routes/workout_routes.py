from fastapi import APIRouter, Depends, HTTPException
import supabase

from ..schemas import WorkoutUpload, WorkoutSplitUpdate
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

@router.put("/update-split")
async def update_split(
    workout: WorkoutSplitUpdate,
    user: dict = Depends(get_current_user),
):
    res = (
        supabase_admin.table("workout_split")
        .update({"muscle_group": workout.muscle_group, "exercises": workout.exercises})
        .eq("id", workout.id)
        .eq("user_id", user["id"])
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to update split")

    return {"message": "Split updated", "data": res.data}

@router.delete('/delete-split')
async def delete_split():
    pass

@router.post("/add-split")
async def add_split(workout: WorkoutUpload, user: dict = Depends(get_current_user)):

    res = supabase_admin.table("workout_split").insert({"user_id": user['id'], "muscle_group": workout.muscle_group, 'exercises': workout.exercises}).execute()
    
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to add split")
    
    return {"message": 'Split added', 'data': res.data}