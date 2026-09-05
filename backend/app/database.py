"""
Database connection and session lifecycle management for SQLAlchemy Async.
Supports both SQLite (local/dev) and PostgreSQL (production/docker).
"""

import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

# Determine database engine arguments
engine_kwargs = {"echo": settings.DEBUG}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

# Async SQLAlchemy Engine & Session Maker
engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables on application startup."""
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    # Ensure all models are registered on Base.metadata
    from app.models.user import User, UserSettings
    from app.models.chat import Conversation, Message, MessageFeedback
    from app.models.document import Document, DocumentChunk

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
