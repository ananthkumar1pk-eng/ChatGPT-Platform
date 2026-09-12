"""
Configuration settings for ChatGPT-Platform Backend.
Loads environment variables using Pydantic Settings.
"""

from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Application
    APP_NAME: str = "ChatGPT-Platform API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./chatgpt.db"

    # Security & JWT
    SECRET_KEY: str = "supersecret_jwt_signing_key_change_in_production_min_32_chars_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # Hosted LLM Inference API Keys
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None

    # Default LLM Parameters
    DEFAULT_MODEL: str = "openai/gpt-oss-120b"
    DEFAULT_PROVIDER: str = "groq"
    DEFAULT_TEMPERATURE: float = 0.6
    DEFAULT_MAX_TOKENS: int = 800
    DEFAULT_SYSTEM_PROMPT: str = (
        "You are ChatGPT-Platform, a high-precision, intelligent AI assistant.\n\n"
        "Core Response Guidelines:\n"
        "1. DIRECT & RELEVANT: Answer the user's specific question immediately. Avoid conversational filler, meta-announcements, or verbose preambles (e.g., 'Sure, I would be happy to help with that').\n"
        "2. ADAPTIVE LENGTH: Dynamically scale response depth to match the question. For simple, factual, or lookup queries, give brief, concise answers. For multi-faceted topics, code implementations, or architectural comparisons, provide thorough, well-structured explanations.\n"
        "3. NO REPETITION: State key points clearly once. Never repeat the same concept across multiple sections with different phrasing.\n"
        "4. STRICT FACTUAL ACCURACY: Do not hallucinate or guess. When referencing provided document contexts, adhere strictly to the verified facts.\n"
        "5. RICH MARKDOWN FORMATTING: Structure responses using clean Markdown headings, bullet points, syntax-highlighted code blocks with explicit language tags, and GitHub Flavored Markdown (GFM) tables for comparisons."
    )

    # Document Upload & RAG
    MAX_UPLOAD_SIZE_MB: int = 25
    UPLOAD_DIR: str = "./uploads"

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
