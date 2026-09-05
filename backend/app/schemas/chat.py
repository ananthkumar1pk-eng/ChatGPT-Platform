"""
Conversation, Message, Feedback, and Streaming Schemas.
"""

from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class SourceCitation(BaseModel):
    document_id: str
    filename: str
    file_type: str
    page_number: int
    chunk_index: int
    score: float
    snippet: str


class FeedbackCreate(BaseModel):
    rating: int = Field(..., description="1 for Thumbs Up, -1 for Thumbs Down")
    feedback_text: Optional[str] = None


class FeedbackOut(BaseModel):
    id: str
    message_id: str
    rating: int
    feedback_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    parent_id: Optional[str] = None
    model: Optional[str] = None
    token_count: int = 0
    sources: Optional[List[Dict[str, Any]]] = None
    finish_reason: Optional[str] = "stop"
    created_at: datetime
    feedback: Optional[FeedbackOut] = None

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    conversation_id: Optional[str] = None  # If None, automatically creates a new conversation
    content: str = Field(..., min_length=1, description="User prompt text")
    model: Optional[str] = None
    provider: Optional[str] = None
    temperature: Optional[float] = None
    system_prompt: Optional[str] = None
    use_rag: bool = True
    document_ids: Optional[List[str]] = None  # Filter RAG search to specific documents


class EditMessageRequest(BaseModel):
    content: str = Field(..., min_length=1)
    model: Optional[str] = None
    provider: Optional[str] = None
    temperature: Optional[float] = None
    use_rag: bool = True


class ConversationCreate(BaseModel):
    title: Optional[str] = "New Chat"
    model: Optional[str] = None
    provider: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = 0.7


class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = None
    provider: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None


class ConversationOut(BaseModel):
    id: str
    title: str
    model: str
    provider: str
    is_pinned: bool
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0
    last_message_preview: Optional[str] = None

    class Config:
        from_attributes = True


class ConversationDetailOut(ConversationOut):
    system_prompt: Optional[str] = None
    temperature: str = "0.7"
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True
