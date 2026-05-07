import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from ..dependencies import get_current_user

router = APIRouter(prefix="/record", tags=["record"])


@router.post("/upload")
async def upload_and_analyze(
    video: UploadFile = File(...),
    user: dict = Depends(get_current_user),):
    
    
    return


