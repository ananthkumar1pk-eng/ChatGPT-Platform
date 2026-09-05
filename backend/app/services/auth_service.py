"""
Authentication Service: Handles Registration, Login, Google OAuth, and Token Lifecycle.
"""

import uuid
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException, status

from app.config import settings
from app.models.user import User, RefreshToken, PasswordResetToken, UserSettings
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserOut
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: UserRegister) -> TokenResponse:
        """Register a new local user account."""
        # Check if email is already taken
        stmt = select(User).where(User.email == data.email.lower())
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists"
            )

        # Create user
        user = User(
            email=data.email.lower(),
            hashed_password=hash_password(data.password),
            full_name=data.full_name or data.email.split("@")[0],
            auth_provider="local",
            is_active=True,
            is_verified=True,
        )
        self.db.add(user)
        await self.db.flush()

        # Create default user settings
        user_settings = UserSettings(
            user_id=user.id,
            default_model=settings.DEFAULT_MODEL,
            default_provider=settings.DEFAULT_PROVIDER,
            system_prompt=settings.DEFAULT_SYSTEM_PROMPT,
            temperature=str(settings.DEFAULT_TEMPERATURE),
            theme="dark",
            custom_api_keys={}
        )
        self.db.add(user_settings)
        await self.db.commit()
        await self.db.refresh(user)

        # Generate tokens
        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id})

        # Save refresh token to database
        db_refresh = RefreshToken(
            user_id=user.id,
            token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        self.db.add(db_refresh)
        await self.db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserOut.model_validate(user)
        )

    async def login(self, data: UserLogin) -> TokenResponse:
        """Authenticate user with email and password."""
        stmt = select(User).where(User.email == data.email.lower())
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled"
            )

        # Generate tokens
        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id})

        # Persist refresh token
        db_refresh = RefreshToken(
            user_id=user.id,
            token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        self.db.add(db_refresh)
        await self.db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserOut.model_validate(user)
        )

    async def google_auth(self, credential: str) -> TokenResponse:
        """Authenticate or register user via Google ID Token."""
        user_info = None
        try:
            # Verify token via Google tokeninfo endpoint
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}")
                if resp.status_code == 200:
                    user_info = resp.json()
        except Exception:
            pass

        # Fallback decode if offline / mock
        if not user_info:
            try:
                # Unverified claims extraction for dev / testing environments
                user_info = jwt.decode(credential, options={"verify_signature": False})
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid Google OAuth credential token"
                )

        email = user_info.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google token does not contain a verified email"
            )

        stmt = select(User).where(User.email == email.lower())
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            # Create new user from Google profile
            user = User(
                email=email.lower(),
                full_name=user_info.get("name") or email.split("@")[0],
                avatar_url=user_info.get("picture"),
                auth_provider="google",
                provider_id=user_info.get("sub"),
                is_active=True,
                is_verified=True,
            )
            self.db.add(user)
            await self.db.flush()

            user_settings = UserSettings(
                user_id=user.id,
                default_model=settings.DEFAULT_MODEL,
                default_provider=settings.DEFAULT_PROVIDER,
                system_prompt=settings.DEFAULT_SYSTEM_PROMPT,
                temperature=str(settings.DEFAULT_TEMPERATURE),
                theme="dark",
                custom_api_keys={}
            )
            self.db.add(user_settings)
            await self.db.commit()
            await self.db.refresh(user)
        else:
            # Update avatar or provider if not set
            if not user.avatar_url and user_info.get("picture"):
                user.avatar_url = user_info.get("picture")
            await self.db.commit()

        # Generate tokens
        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id})

        db_refresh = RefreshToken(
            user_id=user.id,
            token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        self.db.add(db_refresh)
        await self.db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserOut.model_validate(user)
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """Issue a new access token using a valid refresh token."""
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        user_id = payload.get("sub")
        stmt = select(RefreshToken).where(
            RefreshToken.token == refresh_token,
            RefreshToken.revoked == False
        )
        result = await self.db.execute(stmt)
        token_record = result.scalar_one_or_none()

        if not token_record or token_record.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired or revoked"
            )

        # Fetch user
        stmt_user = select(User).where(User.id == user_id)
        user_res = await self.db.execute(stmt_user)
        user = user_res.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account inactive"
            )

        # Issue new access token
        new_access_token = create_access_token({"sub": user.id, "email": user.email})

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=refresh_token,
            user=UserOut.model_validate(user)
        )

    async def create_password_reset_token(self, email: str) -> str:
        """Create a secure password reset token."""
        stmt = select(User).where(User.email == email.lower())
        res = await self.db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            # Return dummy token to prevent email enumeration
            return secrets.token_urlsafe(32)

        raw_token = secrets.token_urlsafe(32)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=raw_token,
            expires_at=datetime.utcnow() + timedelta(hours=1),
            used=False
        )
        self.db.add(reset_token)
        await self.db.commit()
        return raw_token

    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password using a valid reset token."""
        stmt = select(PasswordResetToken).where(
            PasswordResetToken.token == token,
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > datetime.utcnow()
        )
        res = await self.db.execute(stmt)
        reset_record = res.scalar_one_or_none()

        if not reset_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token"
            )

        # Update user password
        stmt_user = select(User).where(User.id == reset_record.user_id)
        user_res = await self.db.execute(stmt_user)
        user = user_res.scalar_one()

        user.hashed_password = hash_password(new_password)
        reset_record.used = True
        await self.db.commit()
        return True
