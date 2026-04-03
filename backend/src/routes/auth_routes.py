from fastapi import APIRouter, HTTPException, Depends, status
from ..schemas import SignUpRequest, LoginRequest, AuthResponse, MessageResponse
from ..supabase_client import supabase
from ..dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
async def signup(body: SignUpRequest):
    try:
        res = supabase.auth.sign_up({"email": body.email, "password": body.password})
        session = res.session
        if not session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signup succeeded but no session returned. Check your Supabase email confirmation settings.",
            )
        return AuthResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            user={"id": res.user.id, "email": res.user.email},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    try:
        res = supabase.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
        session = res.session
        return AuthResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            user={"id": res.user.id, "email": res.user.email},
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/logout", response_model=MessageResponse)
async def logout(user: dict = Depends(get_current_user)):
    return MessageResponse(message="Logged out successfully")


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user
