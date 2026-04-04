from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .supabase_client import supabase, supabase_admin

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Validate the Supabase access token and return the user."""
    token = credentials.credentials
    try:
        res = supabase.auth.get_user(token)
        if not res or not res.user:
            raise ValueError("No user")

        user_data = {
            "id": res.user.id,
            "email": res.user.email,
            "created_at": str(res.user.created_at),
            "first_name": None,
        }

        try:
            profile = (
                supabase_admin.table("profile")
                .select("*")
                .eq("id", str(res.user.id))
                .execute()
            )
            print(f"[DEBUG] profile query for user {res.user.id}: {profile.data}")
            if profile.data and len(profile.data) > 0:
                user_data["first_name"] = profile.data[0].get("first_name")
        except Exception as e:
            print(f"[DEBUG] profile query failed: {e}")

        return user_data
    except Exception:
        pass
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
    )

async def get_history(user: dict = Depends(get_current_user)):
    try:
        result = supabase_admin.table("history").select("*").eq("user_id", user["id"]).execute()
        return result.data
    except Exception as e:
        print(f"[DEBUG] history query failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch history",
        )