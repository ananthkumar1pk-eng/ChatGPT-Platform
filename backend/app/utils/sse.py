"""
Server-Sent Events (SSE) formatting helpers for streaming real-time responses to frontend.
"""

import json
from typing import Any, Dict, Optional


def format_sse(data: Any, event: Optional[str] = None) -> str:
    """Format data into standard SSE wire protocol format: 'event: ...\ndata: ...\n\n'."""
    output = []
    if event:
        output.append(f"event: {event}\n")
    if isinstance(data, (dict, list)):
        payload = json.dumps(data)
    else:
        payload = str(data)
    output.append(f"data: {payload}\n\n")
    return "".join(output)


def sse_token_chunk(token: str) -> str:
    """Helper to stream an incremental token chunk."""
    return format_sse({"token": token}, event="token")


def sse_start_chunk(conversation_id: str, message_id: str, model: str) -> str:
    """Helper to signal the start of a response."""
    return format_sse({
        "conversation_id": conversation_id,
        "message_id": message_id,
        "model": model,
        "status": "started"
    }, event="start")


def sse_sources_chunk(sources: list) -> str:
    """Helper to deliver RAG source citations."""
    return format_sse({"sources": sources}, event="sources")


def sse_done_chunk(full_text: str, token_count: int, finish_reason: str = "stop") -> str:
    """Helper to signal the completion of streaming."""
    return format_sse({
        "full_text": full_text,
        "token_count": token_count,
        "finish_reason": finish_reason,
        "status": "done"
    }, event="done")


def sse_error_chunk(error_message: str) -> str:
    """Helper to signal an error during streaming."""
    return format_sse({"error": error_message, "status": "error"}, event="error")
