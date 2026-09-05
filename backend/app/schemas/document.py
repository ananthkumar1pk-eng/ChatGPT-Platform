"""
Document, Chunk, and RAG Query Schemas.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class ChunkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str
    chunk_index: int
    page_number: int
    content: str
    token_count: int
    meta_info: Optional[Dict[str, Any]] = None
    created_at: datetime


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    file_type: str
    file_size: int
    total_pages: int
    total_chunks: int
    created_at: datetime


class DocumentDetailOut(DocumentOut):
    model_config = ConfigDict(from_attributes=True)

    chunks: List[ChunkOut] = []


class RAGQueryRequest(BaseModel):
    query: str
    top_k: int = 4
    document_ids: Optional[List[str]] = None


class RAGSearchResult(BaseModel):
    document_id: str
    filename: str
    file_type: str
    page_number: int
    chunk_index: int
    score: float
    snippet: str
    full_content: str
