"""
ChatGPT-Platform FastAPI Main Application.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database import init_db
from app.routers import (
    auth_router,
    chat_router,
    documents_router,
    models_router,
    user_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database & Tables
    await init_db()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-User ChatGPT-Style AI Platform with Hosted Inference, RAG, and Real-Time Streaming.",
    version="3.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(models_router)
app.include_router(user_router)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "3.0.0",
        "status": "online",
        "documentation": "/docs"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.APP_ENV,
        "debug": settings.DEBUG
    }
