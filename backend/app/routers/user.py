"""
User Settings & Profile API Router.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserSettings
from app.schemas.user import (
    UserProfileUpdate,
    UserSettingsUpdate,
    UserSettingsOut,
    UserOut,
)
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/user", tags=["User & Settings"])


@router.get("/profile", response_model=UserOut)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return UserOut.model_validate(current_user)


@router.patch("/profile", response_model=UserOut)
async def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user profile information."""
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url

    await db.commit()
    await db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.get("/settings", response_model=UserSettingsOut)
async def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user settings and configured API key indicators."""
    stmt = select(UserSettings).where(UserSettings.user_id == current_user.id)
    res = await db.execute(stmt)
    settings_rec = res.scalar_one_or_none()

    if not settings_rec:
        # Create default settings if not exists
        settings_rec = UserSettings(
            user_id=current_user.id,
            default_model="llama-3.3-70b-versatile",
            default_provider="groq",
            temperature="0.7",
            theme="dark",
            custom_api_keys={}
        )
        db.add(settings_rec)
        await db.commit()
        await db.refresh(settings_rec)

    # Check which custom keys are set
    keys = settings_rec.custom_api_keys or {}
    key_status = {
        "groq": bool(keys.get("groq")),
        "openai": bool(keys.get("openai")),
        "gemini": bool(keys.get("gemini")),
        "anthropic": bool(keys.get("anthropic")),
        "openrouter": bool(keys.get("openrouter")),
    }

    return UserSettingsOut(
        default_model=settings_rec.default_model,
        default_provider=settings_rec.default_provider,
        system_prompt=settings_rec.system_prompt,
        temperature=settings_rec.temperature,
        theme=settings_rec.theme,
        custom_api_keys_status=key_status
    )


@router.patch("/settings", response_model=UserSettingsOut)
async def update_user_settings(
    data: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user inference preferences and API keys."""
    stmt = select(UserSettings).where(UserSettings.user_id == current_user.id)
    res = await db.execute(stmt)
    settings_rec = res.scalar_one_or_none()

    if not settings_rec:
        settings_rec = UserSettings(user_id=current_user.id)
        db.add(settings_rec)

    if data.default_model is not None:
        settings_rec.default_model = data.default_model
    if data.default_provider is not None:
        settings_rec.default_provider = data.default_provider
    if data.system_prompt is not None:
        settings_rec.system_prompt = data.system_prompt
    if data.temperature is not None:
        settings_rec.temperature = str(data.temperature)
    if data.theme is not None:
        settings_rec.theme = data.theme
    if data.custom_api_keys is not None:
        current_keys = dict(settings_rec.custom_api_keys or {})
        for k, v in data.custom_api_keys.items():
            if v:
                current_keys[k] = v.strip()
            elif k in current_keys:
                del current_keys[k]
        settings_rec.custom_api_keys = current_keys

    await db.commit()
    await db.refresh(settings_rec)

    keys = settings_rec.custom_api_keys or {}
    key_status = {
        "groq": bool(keys.get("groq")),
        "openai": bool(keys.get("openai")),
        "gemini": bool(keys.get("gemini")),
        "anthropic": bool(keys.get("anthropic")),
        "openrouter": bool(keys.get("openrouter")),
    }

    return UserSettingsOut(
        default_model=settings_rec.default_model,
        default_provider=settings_rec.default_provider,
        system_prompt=settings_rec.system_prompt,
        temperature=settings_rec.temperature,
        theme=settings_rec.theme,
        custom_api_keys_status=key_status
    )
