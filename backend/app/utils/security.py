"""
Security, Password Hashing, JWT Token Generation and Dependency Extraction.
"""

from datetime import datetime, timedelta
from typing import Optional
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a signed JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )


GUEST_USER_ID = "guest-user-0000-0000-0000-000000000000"


async def get_or_create_guest_user(db: AsyncSession) -> User:
    """Retrieve or create a default guest sandbox user."""
    result = await db.execute(select(User).where(User.id == GUEST_USER_ID))
    guest = result.scalar_one_or_none()
    if not guest:
        from app.models.user import UserSettings
        guest = User(
            id=GUEST_USER_ID,
            email="guest@chatgpt.local",
            full_name="Guest User",
            auth_provider="guest",
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(guest)
        guest_settings = UserSettings(
            user_id=GUEST_USER_ID,
            default_model="llama-3.3-70b-versatile",
            default_provider="groq",
            temperature="0.7",
            theme="dark",
            custom_api_keys={},
        )
        db.add(guest_settings)
        await db.commit()
        await db.refresh(guest)
    return guest


async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency that extracts and validates the authenticated User, or falls back to Guest session."""
    if not auth or not auth.credentials:
        return await get_or_create_guest_user(db)

    try:
        payload = decode_token(auth.credentials)
    except Exception:
        return await get_or_create_guest_user(db)

    if payload.get("type") != "access":
        return await get_or_create_guest_user(db)

    user_id = payload.get("sub")
    if not user_id:
        return await get_or_create_guest_user(db)

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        return await get_or_create_guest_user(db)

    return user



async def get_optional_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Dependency that returns User if token provided and valid, otherwise None."""
    if not auth or not auth.credentials:
        return None
    try:
        payload = decode_token(auth.credentials)
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    except Exception:
        return None
