"""
Authentication & Authorization Module.
Uses Python hashlib PBKDF2-HMAC-SHA256 for secure password hashing with salt,
and JWT tokens for API authorization.
"""

import os
import hashlib
import binascii
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

def get_password_hash(password: str) -> str:
    """Hashes password using PBKDF2-HMAC-SHA256 with random salt."""
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"{binascii.hexlify(salt).decode('ascii')}${binascii.hexlify(dk).decode('ascii')}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against stored salt$hash."""
    try:
        if "$" not in hashed_password:
            # Fallback legacy or plain match
            return plain_password == hashed_password
        salt_hex, hash_hex = hashed_password.split("$", 1)
        salt = binascii.unhexlify(salt_hex.encode('ascii'))
        dk = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return binascii.hexlify(dk).decode('ascii') == hash_hex
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="دەسەڵاتی چوونەژوورەوەت نییە، تکایە بچۆ ژوورەوە",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def require_role(allowed_roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user and current_user.role not in allowed_roles and current_user.role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="دەسەڵاتی پێویستت نییە بۆ ئەنجامدانی ئەم کارە"
            )
        return current_user
    return role_checker
