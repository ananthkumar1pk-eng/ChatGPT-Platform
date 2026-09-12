"""
API Routers Package Initialization.
"""

from app.routers.auth import router as auth_router
from app.routers.chat import router as chat_router
from app.routers.documents import router as documents_router
from app.routers.models import router as models_router
from app.routers.user import router as user_router
from app.routers.vision import router as vision_router
from app.routers.image_gen import router as image_gen_router
from app.routers.audio import router as audio_router

__all__ = [
    "auth_router",
    "chat_router",
    "documents_router",
    "models_router",
    "user_router",
    "vision_router",
    "image_gen_router",
    "audio_router",
]

