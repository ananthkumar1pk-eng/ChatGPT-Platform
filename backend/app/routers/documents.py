"""
Document & RAG Knowledge Base API Router.
Handles multi-format file uploads (PDF, DOCX, TXT, CSV, JSON), text extraction, chunking, and semantic search.
"""

import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.schemas.document import (
    DocumentOut,
    DocumentDetailOut,
    ChunkOut,
    RAGQueryRequest,
    RAGSearchResult,
)
from app.services.rag.parsers import DocumentParser
from app.services.rag.chunker import TextChunker
from app.services.rag.vector_store import VectorStoreService
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/documents", tags=["Documents & RAG"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".csv", ".json"}


@router.post("/upload", response_model=DocumentDetailOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a document (PDF, DOCX, TXT, CSV, JSON).
    Extracts text/tables page-by-page, chunks into overlapping passages, and indexes into database.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format: {ext}. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read content and enforce size limit
    content_bytes = await file.read()
    file_size = len(content_bytes)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
        )

    # Save to disk
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, current_user.id)
    os.makedirs(user_upload_dir, exist_ok=True)
    saved_filename = f"{uuid.uuid4()}_{file.filename}"
    saved_path = os.path.join(user_upload_dir, saved_filename)

    with open(saved_path, "wb") as f:
        f.write(content_bytes)

    # Parse pages / sections
    pages, total_pages = DocumentParser.parse_file(saved_path, file.filename)

    # Generate overlapping chunks
    chunks_data = TextChunker.chunk_document_pages(pages, chunk_size=800, chunk_overlap=150)

    # Create Document record
    doc = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_type=ext.lstrip("."),
        file_size=file_size,
        file_path=saved_path,
        total_pages=total_pages,
        total_chunks=len(chunks_data)
    )
    db.add(doc)
    await db.flush()

    # Create DocumentChunk records
    db_chunks = []
    for c in chunks_data:
        chunk = DocumentChunk(
            document_id=doc.id,
            chunk_index=c["chunk_index"],
            page_number=c["page_number"],
            content=c["content"],
            token_count=c["token_count"],
            meta_info=c["meta_info"]
        )
        db.add(chunk)
        db_chunks.append(chunk)

    await db.commit()
    await db.refresh(doc)

    return DocumentDetailOut(
        id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        file_size=doc.file_size,
        total_pages=doc.total_pages,
        total_chunks=doc.total_chunks,
        created_at=doc.created_at,
        chunks=[ChunkOut.model_validate(c) for c in db_chunks]
    )


@router.get("", response_model=List[DocumentOut])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all uploaded documents for the current user."""
    stmt = (
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
    )
    res = await db.execute(stmt)
    docs = res.scalars().all()
    return [DocumentOut.model_validate(d) for d in docs]


@router.get("/{document_id}", response_model=DocumentDetailOut)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get document details along with all extracted chunks."""
    stmt = select(Document).where(
        Document.id == document_id,
        Document.user_id == current_user.id
    )
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    chunk_stmt = (
        select(DocumentChunk)
        .where(DocumentChunk.document_id == doc.id)
        .order_by(DocumentChunk.chunk_index.asc())
    )
    chunk_res = await db.execute(chunk_stmt)
    chunks = chunk_res.scalars().all()

    return DocumentDetailOut(
        id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        file_size=doc.file_size,
        total_pages=doc.total_pages,
        total_chunks=doc.total_chunks,
        created_at=doc.created_at,
        chunks=[ChunkOut.model_validate(c) for c in chunks]
    )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document and clean up its stored file and chunks."""
    stmt = select(Document).where(
        Document.id == document_id,
        Document.user_id == current_user.id
    )
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Remove file from disk if exists
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    await db.delete(doc)
    await db.commit()
    return {"message": "Document successfully deleted", "id": document_id}


@router.post("/search", response_model=List[RAGSearchResult])
async def search_documents(
    data: RAGQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run semantic RAG search across user documents."""
    vector_service = VectorStoreService(db)
    chunks = await vector_service.search_relevant_chunks(
        user_id=current_user.id,
        query=data.query,
        top_k=data.top_k,
        document_ids=data.document_ids
    )
    return [
        RAGSearchResult(
            document_id=c["document_id"],
            filename=c["filename"],
            file_type=c["file_type"],
            page_number=c["page_number"],
            chunk_index=c["chunk_index"],
            score=c["score"],
            snippet=c["snippet"],
            full_content=c["full_content"]
        ) for c in chunks
    ]
