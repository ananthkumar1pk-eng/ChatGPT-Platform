"""
Audio API Router: Voice-to-Text Transcription powered by Faster-Whisper.
"""

from typing import Optional
from pydantic import BaseModel, Field
import base64
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.models.user import User
from app.services.audio.whisper_service import FasterWhisperService
from app.utils.security import get_optional_current_user

router = APIRouter(prefix="/api/audio", tags=["Audio & Voice-to-Text (Faster-Whisper)"])


class AudioTranscribeRequest(BaseModel):
    audio_base64: str = Field(..., description="Base64 encoded audio string from microphone or file")
    file_extension: str = Field("webm", description="Audio format: 'webm', 'wav', 'mp3', 'm4a', 'ogg'")
    language: Optional[str] = Field(None, description="Optional language code ISO-639 (e.g. 'en', 'es', 'fr')")
    model_size: str = Field("base", description="Faster-Whisper model size ('tiny', 'base', 'small', 'medium')")


@router.post("/transcribe")
async def transcribe_audio_voice(
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Transcribe microphone voice recording or uploaded audio file to text using Faster-Whisper.
    Accepts application/json with `audio_base64` or multipart/form-data with `file`.
    """
    content_type = request.headers.get("content-type", "").lower()
    audio_bytes = None
    ext = "webm"
    target_lang = None
    target_size = "base"

    if "multipart/form-data" in content_type:
        try:
            form = await request.form()
            file = form.get("file")
            if file and hasattr(file, "read"):
                audio_bytes = await file.read()
                filename = getattr(file, "filename", "recording.webm") or "recording.webm"
                ext = filename.split(".")[-1].lower() if "." in filename else "webm"
            target_lang = form.get("language")
            target_size = form.get("model_size") or "base"
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid form data: {e}")
    else:
        try:
            body = await request.json()
            raw_b64 = body.get("audio_base64")
            if not raw_b64:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing 'audio_base64' in JSON.")
            if "base64," in raw_b64:
                raw_b64 = raw_b64.split("base64,")[1]
            audio_bytes = base64.b64decode(raw_b64)
            ext = body.get("file_extension") or "webm"
            target_lang = body.get("language")
            target_size = body.get("model_size") or "base"
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid JSON audio payload: {e}")

    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either multipart 'file' or JSON 'audio_base64' payload."
        )

    try:
        res = FasterWhisperService.transcribe_audio(
            audio_bytes=audio_bytes,
            file_extension=ext,
            language=target_lang,
            model_size=target_size
        )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Faster-Whisper transcription failed: {str(e)}"
        )
