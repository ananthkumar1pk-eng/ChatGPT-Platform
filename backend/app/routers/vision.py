"""
Vision API Router: Camera Snapshot & Picture Analysis powered by Microsoft Florence-2 VLM.
"""

import logging
from typing import Optional, Dict
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)


from app.database import get_db
from app.models.user import User, UserSettings
from app.services.vision.florence_service import Florence2VisionService
from app.utils.security import get_optional_current_user

router = APIRouter(prefix="/api/vision", tags=["Vision & Camera Analysis (Florence-2)"])


class VisionAnalysisRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image or Data URI from Camera / Upload")
    task: str = Field("more_detailed_caption", description="Florence-2 task prompt type")
    custom_question: Optional[str] = Field(None, description="Optional custom question for Visual QA")


@router.post("/analyze")
async def analyze_camera_picture(
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze a camera snapshot or uploaded picture using Microsoft Florence-2 VLM.
    Accepts either application/json with `image_base64` or multipart/form-data with `file`.
    Supports tasks:
    - more_detailed_caption (Deep visual scene understanding)
    - detailed_caption (Detailed description)
    - caption (Quick caption)
    - object_detection (Bounding box detection & labels)
    - ocr (Optical character recognition)
    - dense_caption (Dense regional descriptions)
    - vqa (Visual Question Answering)
    """
    content_type = request.headers.get("content-type", "").lower()
    selected_task = "more_detailed_caption"
    question = None
    image_data = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            image_data = body.get("image_base64")
            selected_task = body.get("task") or "more_detailed_caption"
            question = body.get("custom_question")
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid JSON payload: {e}")
    elif "multipart/form-data" in content_type:
        try:
            form = await request.form()
            file = form.get("file")
            if file and hasattr(file, "read"):
                image_data = await file.read()
            elif "image_base64" in form:
                image_data = form.get("image_base64")
            selected_task = form.get("task") or "more_detailed_caption"
            question = form.get("custom_question")
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid form data: {e}")
    else:
        # Fallback parse as JSON
        try:
            body = await request.json()
            image_data = body.get("image_base64")
            selected_task = body.get("task") or "more_detailed_caption"
            question = body.get("custom_question")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must provide either multipart 'file' or JSON 'image_base64' payload."
            )

    if not image_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either multipart 'file' or JSON 'image_base64' payload."
        )

    # Extract user custom API keys from settings if present
    custom_keys: Dict[str, str] = {}
    try:
        if current_user:
            settings_stmt = select(UserSettings).where(UserSettings.user_id == current_user.id)
            settings_res = await db.execute(settings_stmt)
            user_settings = settings_res.scalar_one_or_none()
            if user_settings and user_settings.custom_api_keys:
                custom_keys = user_settings.custom_api_keys
        else:
            settings_stmt = select(UserSettings).where(UserSettings.custom_api_keys.isnot(None)).limit(1)
            settings_res = await db.execute(settings_stmt)
            user_settings = settings_res.scalar_one_or_none()
            if user_settings and user_settings.custom_api_keys:
                custom_keys = user_settings.custom_api_keys
    except Exception as e:
        logger.warning(f"Could not load custom user keys: {e}")

    try:
        result = Florence2VisionService.analyze_image(
            image_input=image_data,
            task=selected_task,
            custom_question=question,
            custom_api_keys=custom_keys
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Florence-2 analysis failed: {str(e)}"
        )
