"""
Authentication Router.
Handles login, JWT tokens, and user profiling.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import Token, UserOut, UserCreate
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user

from pydantic import BaseModel
import time

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Simple In-Memory Brute Force Tracker (IP/Username tracking)
failed_attempts = {}

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_username: Optional[str] = None
    new_password: str

@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    ip_key = form_data.username.strip().lower()
    now = time.time()

    # Brute-force protection: Lock out after 5 consecutive failed attempts for 15 minutes
    if ip_key in failed_attempts:
        attempts, last_time = failed_attempts[ip_key]
        if attempts >= 5 and (now - last_time) < 900:
            remaining_mins = int((900 - (now - last_time)) / 60) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"هەوڵی چوونەژوورەوەی زۆر دراوە. تکایە {remaining_mins} خولەکی تر هەوڵ بدەرەوە."
            )
        elif (now - last_time) >= 900:
            failed_attempts[ip_key] = (0, now)

    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        # Increment failed attempts
        cur_attempts = failed_attempts.get(ip_key, (0, now))[0] + 1
        failed_attempts[ip_key] = (cur_attempts, now)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Reset failed attempts on success
    if ip_key in failed_attempts:
        del failed_attempts[ip_key]

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ئەم هەژمارە ناچالاک کراوە"
        )

    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "full_name_ku": user.full_name_ku,
        "role": user.role
    }

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
def change_admin_credentials(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Securely updates the administrator's password and/or username."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="وشەی نهێنی ئێستات هەڵەیە"
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="وشەی نهێنی نوێ دەبێت لانیکەم ٦ پیت یان ژمارە بێت"
        )

    if payload.new_username and payload.new_username.strip():
        new_u = payload.new_username.strip()
        # Check if taken
        existing = db.query(User).filter(User.username == new_u, User.id != current_user.id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ئەم ناوی بەکارهێنەرە پێشتر بەکارهاتووە"
            )
        current_user.username = new_u

    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    return {"success": True, "message_ku": "ناوی بەکارهێنەر و وشەی نهێنی بە سەرکەوتوویی گۆڕدرا"}
