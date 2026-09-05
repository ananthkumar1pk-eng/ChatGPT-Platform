"""
User Profile, Settings, and Model Listing Schemas.
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr
from app.schemas.auth import UserOut



class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserSettingsUpdate(BaseModel):
    default_model: Optional[str] = None
    default_provider: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[str] = None
    theme: Optional[str] = None
    custom_api_keys: Optional[Dict[str, str]] = None  # e.g. {"groq": "gsk_...", "openai": "sk-..."}


class UserSettingsOut(BaseModel):
    default_model: str
    default_provider: str
    system_prompt: Optional[str] = None
    temperature: str
    theme: str
    custom_api_keys_status: Dict[str, bool] = {}  # Returns True/False if key exists for provider

    class Config:
        from_attributes = True


class AvailableModel(BaseModel):
    id: str
    name: str
    provider: str
    description: str
    context_window: str
    is_default: bool = False
    is_free: bool = False
