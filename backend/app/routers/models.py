"""
Models API Router.
Returns the catalog of available hosted LLM models and provider capabilities.
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserSettings
from app.schemas.user import AvailableModel
from app.services.llm.router import LLMRouter, SUPPORTED_MODELS
from app.utils.security import get_optional_current_user

router = APIRouter(prefix="/api/models", tags=["Models"])


@router.get("", response_model=List[AvailableModel])
async def get_models(
    current_user: User = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Return all available hosted models with provider metadata."""
    return LLMRouter.get_supported_models()
