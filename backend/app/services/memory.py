"""
Conversation Memory & Context Window Management.
Assembles chat history, trims tokens within context limits, and injects system prompts and RAG contexts.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.chat import Conversation, Message
from app.config import settings


class ConversationMemoryManager:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_messages_for_llm(
        self,
        conversation_id: str,
        system_prompt: Optional[str] = None,
        rag_context_prompt: Optional[str] = None,
        max_context_tokens: int = 8000
    ) -> List[Dict[str, str]]:
        """
        Builds the ordered list of messages formatted for LLM API invocation:
        [
            {"role": "system", "content": "..."},
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "..."}
        ]
        """
        # 1. Fetch conversation messages
        stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
        res = await self.db.execute(stmt)
        db_messages = res.scalars().all()

        llm_messages: List[Dict[str, str]] = []

        # 2. Build system message with RAG context
        base_system = system_prompt or settings.DEFAULT_SYSTEM_PROMPT
        if rag_context_prompt:
            full_system = f"{base_system}\n{rag_context_prompt}"
        else:
            full_system = base_system

        llm_messages.append({"role": "system", "content": full_system})

        # 3. Add message history
        # Estimate ~1.3 tokens per word
        accumulated_tokens = len(full_system.split()) * 1.3
        history_buffer = []

        # Process messages in reverse order to keep most recent turns if budget is exceeded
        for msg in reversed(db_messages):
            msg_tokens = len(msg.content.split()) * 1.3
            if accumulated_tokens + msg_tokens > max_context_tokens:
                break
            accumulated_tokens += msg_tokens
            history_buffer.append({
                "role": msg.role,
                "content": msg.content
            })

        # Reverse back to chronological order
        history_buffer.reverse()
        llm_messages.extend(history_buffer)

        return llm_messages

    @staticmethod
    def generate_chat_title(user_prompt: str) -> str:
        """Derive a clean, concise conversation title from the first user prompt."""
        cleaned = user_prompt.strip().replace("\n", " ")
        # Truncate and strip punctuation
        if len(cleaned) <= 40:
            return cleaned or "New Chat"
        words = cleaned.split()
        title_words = []
        cur_len = 0
        for w in words:
            if cur_len + len(w) > 35:
                break
            title_words.append(w)
            cur_len += len(w) + 1
        return " ".join(title_words) + ("..." if len(words) > len(title_words) else "")
