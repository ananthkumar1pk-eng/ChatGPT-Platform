"""
Image Generation API Router: Sana 1.6B Linear Diffusion Text-to-Image Generation.
"""

from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
import os

from app.models.user import User
from app.services.image.sana_service import SanaImageService
from app.utils.security import get_optional_current_user

router = APIRouter(prefix="/api/image", tags=["Image Generation (Sana 1.6B)"])


class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=2, description="Text prompt describing the image to generate")
    negative_prompt: Optional[str] = Field(None, description="Elements to exclude/avoid in generation")
    aspect_ratio: str = Field("1:1", description="Aspect ratio: '1:1', '16:9', '9:16', '4:3', '3:2'")
    num_inference_steps: int = Field(24, ge=1, le=50, description="Number of diffusion sampling steps")
    guidance_scale: float = Field(5.0, ge=1.0, le=15.0, description="Classifier-free guidance scale")
    seed: Optional[int] = Field(None, description="Random seed for reproducibility")
    style_preset: Optional[str] = Field(None, description="Artistic style preset ('photorealistic', 'anime', 'cyberpunk', 'digital-art', 'cinematic-3d')")


@router.post("/generate")
async def generate_image_with_sana(
    req: ImageGenerationRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Generate high-resolution visual art from text prompts using the Sana 1.6B diffusion model.
    """
    if not req.prompt.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prompt cannot be empty.")

    try:
        res = SanaImageService.generate_image(
            prompt=req.prompt.strip(),
            negative_prompt=req.negative_prompt,
            aspect_ratio=req.aspect_ratio,
            num_inference_steps=req.num_inference_steps,
            guidance_scale=req.guidance_scale,
            seed=req.seed,
            style_preset=req.style_preset
        )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sana 1.6B generation failed: {str(e)}"
        )


@router.get("/artifacts/{filename}")
async def get_generated_artifact(filename: str):
    """Serve generated image artifact files directly."""
    out_dir = SanaImageService.ensure_output_dir()
    filepath = os.path.join(out_dir, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image artifact not found.")
    return FileResponse(filepath, media_type="image/png")
