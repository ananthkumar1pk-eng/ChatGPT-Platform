"""
Chat API Router: Conversation Management, Server-Sent Events (SSE) Streaming, Edit, Regenerate, Feedback, and Export.
"""

from typing import List, Optional
import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, desc, func

from app.database import get_db
from app.models.user import User, UserSettings
from app.models.chat import Conversation, Message, MessageFeedback
from app.schemas.chat import (
    ConversationCreate,
    ConversationUpdate,
    ConversationOut,
    ConversationDetailOut,
    MessageCreate,
    MessageOut,
    FeedbackCreate,
    FeedbackOut,
    EditMessageRequest,
)
from app.services.memory import ConversationMemoryManager
from app.services.rag.vector_store import VectorStoreService
from app.services.llm.router import LLMRouter
from app.utils.security import get_current_user
from app.utils.sse import (
    sse_start_chunk,
    sse_token_chunk,
    sse_sources_chunk,
    sse_done_chunk,
    sse_error_chunk,
)

router = APIRouter(prefix="/api/chat", tags=["Chat & Conversations"])


@router.get("/conversations", response_model=List[ConversationOut])
async def list_conversations(
    q: Optional[str] = Query(None, description="Search query filter for titles or messages"),
    is_archived: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all conversations for current user with optional title/text search filter."""
    stmt = (
        select(Conversation)
        .where(
            Conversation.user_id == current_user.id,
            Conversation.is_archived == is_archived
        )
        .order_by(Conversation.is_pinned.desc(), Conversation.updated_at.desc())
    )

    if q:
        stmt = stmt.where(Conversation.title.ilike(f"%{q}%"))

    res = await db.execute(stmt)
    conversations = res.scalars().all()

    # Populate message count and preview
    out_list = []
    for conv in conversations:
        # Get count
        count_stmt = select(func.count(Message.id)).where(Message.conversation_id == conv.id)
        count_res = await db.execute(count_stmt)
        msg_count = count_res.scalar_one() or 0

        # Get last message
        last_stmt = select(Message.content).where(Message.conversation_id == conv.id).order_by(Message.created_at.desc()).limit(1)
        last_res = await db.execute(last_stmt)
        last_msg = last_res.scalar_one_or_none()

        out = ConversationOut(
            id=conv.id,
            title=conv.title,
            model=conv.model,
            provider=conv.provider,
            is_pinned=conv.is_pinned,
            is_archived=conv.is_archived,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=msg_count,
            last_message_preview=last_msg[:80] + "..." if last_msg and len(last_msg) > 80 else last_msg
        )
        out_list.append(out)

    return out_list


@router.post("/conversations", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new conversation session."""
    # Get user default settings
    settings_stmt = select(UserSettings).where(UserSettings.user_id == current_user.id)
    settings_res = await db.execute(settings_stmt)
    user_settings = settings_res.scalar_one_or_none()

    model = data.model or (user_settings.default_model if user_settings else "llama-3.3-70b-versatile")
    provider = data.provider or (user_settings.default_provider if user_settings else "groq")
    system_prompt = data.system_prompt or (user_settings.system_prompt if user_settings else None)
    temperature = str(data.temperature or 0.7)

    conv = Conversation(
        user_id=current_user.id,
        title=data.title or "New Chat",
        model=model,
        provider=provider,
        system_prompt=system_prompt,
        temperature=temperature,
        is_pinned=False,
        is_archived=False,
    )
    db.add(conv)
    await self_commit(db)
    await db.refresh(conv)

    return ConversationOut(
        id=conv.id,
        title=conv.title,
        model=conv.model,
        provider=conv.provider,
        is_pinned=conv.is_pinned,
        is_archived=conv.is_archived,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=0,
        last_message_preview=None
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailOut)
async def get_conversation_detail(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get conversation details with complete ordered message history."""
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    )
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()

    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    # Fetch messages
    msg_stmt = (
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
    )
    msg_res = await db.execute(msg_stmt)
    messages = msg_res.scalars().all()

    # Load feedback for each message if exists
    msg_out_list = []
    for m in messages:
        fb_stmt = select(MessageFeedback).where(MessageFeedback.message_id == m.id)
        fb_res = await db.execute(fb_stmt)
        fb = fb_res.scalar_one_or_none()

        msg_out_list.append(MessageOut(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            parent_id=m.parent_id,
            model=m.model,
            token_count=m.token_count,
            sources=m.sources,
            finish_reason=m.finish_reason,
            created_at=m.created_at,
            feedback=FeedbackOut.model_validate(fb) if fb else None
        ))

    return ConversationDetailOut(
        id=conv.id,
        title=conv.title,
        model=conv.model,
        provider=conv.provider,
        system_prompt=conv.system_prompt,
        temperature=conv.temperature,
        is_pinned=conv.is_pinned,
        is_archived=conv.is_archived,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=len(msg_out_list),
        messages=msg_out_list
    )


@router.patch("/conversations/{conversation_id}", response_model=ConversationOut)
async def update_conversation(
    conversation_id: str,
    data: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update conversation properties (title, pin, archive, model, temperature)."""
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    )
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()

    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    if data.title is not None:
        conv.title = data.title
    if data.model is not None:
        conv.model = data.model
    if data.provider is not None:
        conv.provider = data.provider
    if data.system_prompt is not None:
        conv.system_prompt = data.system_prompt
    if data.temperature is not None:
        conv.temperature = str(data.temperature)
    if data.is_pinned is not None:
        conv.is_pinned = data.is_pinned
    if data.is_archived is not None:
        conv.is_archived = data.is_archived

    conv.updated_at = datetime.utcnow()
    await self_commit(db)
    await db.refresh(conv)

    return ConversationOut.model_validate(conv)


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a conversation and all its associated messages."""
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    )
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()

    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    await db.delete(conv)
    await self_commit(db)
    return {"message": "Conversation successfully deleted", "id": conversation_id}


@router.post("/stream")
async def stream_chat_response(
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Core Server-Sent Events (SSE) streaming endpoint.
    1. Finds or creates conversation.
    2. Persists the user message.
    3. Runs RAG retrieval if enabled.
    4. Streams assistant response tokens word-by-word.
    5. Persists the completed assistant response.
    """
    # 1. Fetch user settings for API keys
    settings_stmt = select(UserSettings).where(UserSettings.user_id == current_user.id)
    settings_res = await db.execute(settings_stmt)
    user_settings = settings_res.scalar_one_or_none()
    custom_keys = user_settings.custom_api_keys if user_settings else {}

    # 2. Get or create conversation
    conv = None
    if data.conversation_id:
        stmt = select(Conversation).where(
            Conversation.id == data.conversation_id,
            Conversation.user_id == current_user.id
        )
        res = await db.execute(stmt)
        conv = res.scalar_one_or_none()

    if not conv:
        # Create new conversation
        auto_title = ConversationMemoryManager.generate_chat_title(data.content)
        conv = Conversation(
            user_id=current_user.id,
            title=auto_title,
            model=data.model or (user_settings.default_model if user_settings else "llama-3.3-70b-versatile"),
            provider=data.provider or (user_settings.default_provider if user_settings else "groq"),
            system_prompt=data.system_prompt or (user_settings.system_prompt if user_settings else None),
            temperature=str(data.temperature or 0.7),
        )
        db.add(conv)
        await self_commit(db)
        await db.refresh(conv)
    else:
        # If conversation is default titled, auto-update title from prompt
        if conv.title == "New Chat":
            conv.title = ConversationMemoryManager.generate_chat_title(data.content)

    # Update conversation model / provider if specified in request
    if data.model:
        conv.model = data.model
    if data.provider:
        conv.provider = data.provider
    conv.updated_at = datetime.utcnow()

    # 3. Add user message
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=data.content,
        model=conv.model,
        token_count=max(1, len(data.content.split())),
    )
    db.add(user_msg)
    await self_commit(db)
    await db.refresh(user_msg)

    # 4. RAG Document Retrieval
    rag_prompt = ""
    citations = []
    if data.use_rag:
        vector_service = VectorStoreService(db)
        chunks = await vector_service.search_relevant_chunks(
            user_id=current_user.id,
            query=data.content,
            top_k=4,
            document_ids=data.document_ids
        )
        if chunks:
            rag_prompt, citations = VectorStoreService.format_rag_context(chunks)

    # 5. Format Chat Context for LLM
    memory_mgr = ConversationMemoryManager(db)
    llm_messages = await memory_mgr.get_messages_for_llm(
        conversation_id=conv.id,
        system_prompt=conv.system_prompt,
        rag_context_prompt=rag_prompt
    )

    # 6. Resolve LLM Provider
    provider_inst, resolved_model, resolved_provider = LLMRouter.resolve_provider(
        provider_name=conv.provider,
        model_name=conv.model,
        user_custom_keys=custom_keys
    )

    conv_id = conv.id
    temp = float(conv.temperature or 0.7)

    # 7. Define async generator for streaming
    async def sse_event_stream():
        assistant_msg_id = str(uuid.uuid4())
        full_response_text = []

        # Yield start event
        yield sse_start_chunk(
            conversation_id=conv_id,
            message_id=assistant_msg_id,
            model=resolved_model
        )

        # Yield citations if any
        if citations:
            yield sse_sources_chunk(citations)

        try:
            # Stream tokens
            async for token in provider_inst.stream_chat(
                messages=llm_messages,
                model=resolved_model,
                temperature=temp
            ):
                full_response_text.append(token)
                yield sse_token_chunk(token)

            completed_text = "".join(full_response_text)
            token_count = max(1, len(completed_text.split()))

            # Yield done event
            yield sse_done_chunk(
                full_text=completed_text,
                token_count=token_count,
                finish_reason="stop"
            )

            # Persist assistant message in background
            # Note: Create a new async session for post-stream write
            from app.database import async_session_factory
            async with async_session_factory() as post_db:
                assistant_msg = Message(
                    id=assistant_msg_id,
                    conversation_id=conv_id,
                    role="assistant",
                    content=completed_text,
                    model=resolved_model,
                    token_count=token_count,
                    sources=citations,
                    finish_reason="stop",
                )
                post_db.add(assistant_msg)
                # Update conversation timestamp
                stmt_up = (
                    update(Conversation)
                    .where(Conversation.id == conv_id)
                    .values(updated_at=datetime.utcnow())
                )
                await post_db.execute(stmt_up)
                await post_db.commit()

        except Exception as e:
            error_msg = f"Inference error: {str(e)}"
            yield sse_error_chunk(error_msg)

    return StreamingResponse(
        sse_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/messages/{message_id}/feedback", response_model=FeedbackOut)
async def submit_feedback(
    message_id: str,
    data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit thumbs up (+1) or thumbs down (-1) feedback on a message."""
    # Ensure message exists
    msg_stmt = (
        select(Message)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(Message.id == message_id, Conversation.user_id == current_user.id)
    )
    res = await db.execute(msg_stmt)
    msg = res.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    # Upsert feedback
    fb_stmt = select(MessageFeedback).where(MessageFeedback.message_id == message_id)
    fb_res = await db.execute(fb_stmt)
    fb = fb_res.scalar_one_or_none()

    if not fb:
        fb = MessageFeedback(
            message_id=message_id,
            user_id=current_user.id,
            rating=data.rating,
            feedback_text=data.feedback_text
        )
        db.add(fb)
    else:
        fb.rating = data.rating
        fb.feedback_text = data.feedback_text

    await self_commit(db)
    await db.refresh(fb)
    return FeedbackOut.model_validate(fb)


@router.get("/conversations/{conversation_id}/export")
async def export_conversation(
    conversation_id: str,
    format: str = Query("markdown", enum=["markdown", "json"]),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export conversation history as downloadable Markdown or JSON."""
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    )
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    msg_stmt = select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at.asc())
    msg_res = await db.execute(msg_stmt)
    messages = msg_res.scalars().all()

    if format == "json":
        data = {
            "title": conv.title,
            "model": conv.model,
            "created_at": conv.created_at.isoformat(),
            "messages": [
                {
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at.isoformat(),
                    "sources": m.sources
                } for m in messages
            ]
        }
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="chat_{conv.id[:8]}.json"'}
        )

    # Markdown format
    md_lines = [
        f"# {conv.title}\n",
        f"*Exported from ChatGPT-Platform on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}*\n",
        f"**Model**: `{conv.model}` | **Provider**: `{conv.provider}`\n\n---\n\n"
    ]
    for m in messages:
        role_title = "👤 **User**" if m.role == "user" else "🤖 **Assistant**"
        md_lines.append(f"{role_title} ({m.created_at.strftime('%H:%M:%S')}):\n\n{m.content}\n\n")
        if m.sources:
            md_lines.append("> **Sources Cited**:\n")
            for s in m.sources:
                md_lines.append(f"> - *{s.get('filename')}* (Page {s.get('page_number')}): {s.get('snippet')}\n")
            md_lines.append("\n")
        md_lines.append("---\n\n")

    return Response(
        content="".join(md_lines),
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="chat_{conv.id[:8]}.md"'}
    )


async def self_commit(db: AsyncSession):
    """Helper to commit transactions cleanly."""
    await db.commit()
