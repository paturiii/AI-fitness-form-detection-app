from fastapi import APIRouter, Depends, HTTPException
from ..schemas import WorkoutUpload, WorkoutSplitUpdate
from ..supabase_client import supabase_admin
from ..dependencies import get_current_user, get_workouts
from datetime import datetime
from dateutil.relativedelta import relativedelta
import numpy as np
from sklearn.linear_model import LinearRegression

router = APIRouter(prefix="/workouts", tags=["workouts"])


# Helper Functions
def normalize(name: str) -> list[str]:
    return name.lower().replace("-", " ").replace("_", " ").split()

def get_raw_data(user):
    date = datetime.now().date()
    six = (date - relativedelta(months=6)).replace(day=1)

    res = (
        supabase_admin.table("history")
        .select("date, exercises")
        .eq("user_id", user["id"])
        .gte("date", str(six))
        .lte("date", str(date))
        .order("date", desc= False)
        .limit(250)
        .execute()
    )

    return res.data

def get_organized_data(data, search_tokens, exercise):

    res = []

    for i in data:
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

        res.append(
            {
                "date": i['date'],
                "weight": weight,
                "sets": sets,
                "reps": reps,
                "e1rm": e1rm,
                "volume": volume,
            }
        )

    res.sort(key=lambda d: d["date"])
    return res


# Routes
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

@router.get("/analytics")
def get_exercises_analytics(exercise: str, user: dict = Depends(get_current_user)):
    search_tokens = normalize(exercise)
    res = get_raw_data(user)
    data = get_organized_data(res, search_tokens, exercise)

    return { "exercise": exercise, 'timeline': data}

@router.get('/analytics/monthly')
def monthly_stats(exercise: str, user: dict = Depends(get_current_user)):
    search_tokens = normalize(exercise)
    raw = get_organized_data(get_raw_data(user), search_tokens, exercise)

    buckets: dict[str, dict] = {}
    for entry in raw:
        month = entry["date"][:7]
        
        if month not in buckets:
            buckets[month] = {"e1rm_vals": [], "volume_vals": []}

        buckets[month]["e1rm_vals"].append(entry["e1rm"])
        buckets[month]["volume_vals"].append(entry["volume"])

    timeline = [
        {
            "date": month,
            "e1rm": round(sum(b["e1rm_vals"]) / len(b["e1rm_vals"]), 1),
            "volume": round(sum(b["volume_vals"]) / len(b["volume_vals"]), 1),
        }
        for month, b in sorted(buckets.items())
    ]

    return {"exercise": exercise, "timeline": timeline}