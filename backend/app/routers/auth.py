"""
Authentication API Router: Registration, Login, Google OAuth, Password Reset, and Session Management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    GoogleAuthRequest,
    TokenResponse,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    UserOut,
)
from app.services.auth_service import AuthService
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user account with email and password."""
    service = AuthService(db)
    return await service.register(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate with email and password."""
    service = AuthService(db)
    return await service.login(data)


@router.post("/google", response_model=TokenResponse)
async def google_auth(data: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate or sign up using Google OAuth ID token."""
    service = AuthService(db)
    return await service.google_auth(data.credential)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Obtain a new JWT access token using a refresh token."""
    service = AuthService(db)
    return await service.refresh(data.refresh_token)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return UserOut.model_validate(current_user)


@router.post("/forgot-password")
async def forgot_password(data: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset token."""
    service = AuthService(db)
    token = await service.create_password_reset_token(data.email)
    return {"message": "If an account exists, a password reset link/token has been generated.", "reset_token": token}


@router.post("/reset-password")
async def reset_password(data: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid reset token."""
    service = AuthService(db)
    await service.reset_password(data.token, data.new_password)
    return {"message": "Password has been successfully updated. You may now log in."}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Log out user session."""
    return {"message": "Successfully logged out"}
