"""
Authentication Router.
Handles login, JWT tokens, and user profiling.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import Token, UserOut, UserCreate
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user

from pydantic import BaseModel
import time

router = APIRouter(prefix="/api/auth", tags=["auth"])

# In-Memory Brute Force Tracker (Tracks failed attempts per IP and per (IP, Username))
ip_failed_attempts = {}
ip_user_failed_attempts = {}

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_username: Optional[str] = None
    new_password: str

@router.post("/token", response_model=Token)
def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    client_ip = get_client_ip(request)
    normalized_user = form_data.username.strip().lower()
    ip_user_key = f"{client_ip}:{normalized_user}"
    now = time.time()

    # 1. IP-level brute-force lock (e.g. scanning multiple accounts)
    if client_ip in ip_failed_attempts:
        ip_attempts, ip_last = ip_failed_attempts[client_ip]
        if ip_attempts >= 10 and (now - ip_last) < 900:
            remaining_mins = int((900 - (now - ip_last)) / 60) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"هەوڵی نەگونجاوی زۆر لەم ئایپیەوە دراوە. تکایە {remaining_mins} خولەکی تر هەوڵ بدەرەوە."
            )
        elif (now - ip_last) >= 900:
            ip_failed_attempts[client_ip] = (0, now)

    # 2. Targeted IP+User lock (5 consecutive failed attempts on an account from this IP)
    if ip_user_key in ip_user_failed_attempts:
        user_attempts, user_last = ip_user_failed_attempts[ip_user_key]
        if user_attempts >= 5 and (now - user_last) < 900:
            remaining_mins = int((900 - (now - user_last)) / 60) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"هەوڵی چوونەژوورەوەی زۆر دراوە. تکایە {remaining_mins} خولەکی تر هەوڵ بدەرەوە."
            )
        elif (now - user_last) >= 900:
            ip_user_failed_attempts[ip_user_key] = (0, now)

    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        # Increment failed counters
        cur_ip_att = ip_failed_attempts.get(client_ip, (0, now))[0] + 1
        ip_failed_attempts[client_ip] = (cur_ip_att, now)

        cur_user_att = ip_user_failed_attempts.get(ip_user_key, (0, now))[0] + 1
        ip_user_failed_attempts[ip_user_key] = (cur_user_att, now)

        time.sleep(0.3)  # Mitigate timing side-channel attacks
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Reset failed attempts on success for this IP and user
    if client_ip in ip_failed_attempts:
        del ip_failed_attempts[client_ip]
    if ip_user_key in ip_user_failed_attempts:
        del ip_user_failed_attempts[ip_user_key]

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
