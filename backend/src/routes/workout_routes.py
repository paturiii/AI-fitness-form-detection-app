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

@router.delete('/delete-split/{item_id}')
async def delete_split(item_id: str, user: dict = Depends(get_current_user)):
        res = (
            supabase_admin.table("workout_split")
            .delete()
            .eq("id", item_id)
            .eq("user_id", user["id"])
            .execute()
        )

        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to delete split")
        
        return {"message": "Split deleted"}
    

@router.post("/add-split")
async def add_split(workout: WorkoutUpload, user: dict = Depends(get_current_user)):

    res = supabase_admin.table("workout_split").insert({"user_id": user['id'], "muscle_group": workout.muscle_group, 'exercises': workout.exercises}).execute()
    
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to add split")
    
    return {"message": 'Split added', 'data': res.data}

def normalize(name: str) -> list[str]:
    return name.lower().replace("-", " ").replace("_", " ").split()


@router.get("/analytics")
def get_exercises_analytics(exercise: str, user: dict = Depends(get_current_user)):

    data = []
    search_tokens = normalize(exercise)

    res = supabase_admin.table("history").select('*').eq('user_id', user['id']).execute()

    for i in res.data:
        exercises_dict = i.get('exercises', {})
        ex = next(
            (v for k, v in exercises_dict.items() if normalize(k) == search_tokens),
            None,
        )
        if not ex:
            continue
    
        weight = ex.get('weight', 0)
        reps = ex.get('reps', 0)
        sets = ex.get('sets', 0)

        if weight == 0:
            e1rm = reps
            volume = reps * sets
        else:
            e1rm = weight * (1 + reps / 30)
            volume = weight * reps * sets

        data.append(
            {
                "date": i['date'],
                "weight": weight,
                "sets": sets,
                "reps": reps,
                "e1rm": e1rm,
                "volume": volume,
            }
        )
    data.sort(key=lambda d: d["date"])
    return { "exercise": exercise, 'timeline': data}