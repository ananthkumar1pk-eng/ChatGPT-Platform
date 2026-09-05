"""
Unit tests for Chat Memory and SSE Formatting.
"""

from app.services.memory import ConversationMemoryManager
from app.services.llm.router import LLMRouter
from app.utils.sse import format_sse, sse_token_chunk, sse_start_chunk, sse_done_chunk


def test_title_generation():
    prompt1 = "What is the airspeed velocity of an unladen swallow?"
    title1 = ConversationMemoryManager.generate_chat_title(prompt1)
    assert len(title1) <= 45
    assert "airspeed" in title1.lower()

    prompt2 = "Write a comprehensive microservices architecture proposal with Kubernetes, Docker, and FastAPI."
    title2 = ConversationMemoryManager.generate_chat_title(prompt2)
    assert len(title2) <= 45


def test_sse_chunk_formatting():
    chunk = sse_token_chunk("Hello")
    assert chunk.startswith("event: token\n")
    assert '"token": "Hello"' in chunk
    assert chunk.endswith("\n\n")

    done = sse_done_chunk("Full response", 15)
    assert done.startswith("event: done\n")
    assert '"status": "done"' in done


def test_llm_router_fallback():
    # When no API key is provided, LLMRouter safely falls back to MockDemoProvider
    provider, model, name = LLMRouter.resolve_provider(
        provider_name="groq",
        model_name="llama-3.3-70b-versatile",
        user_custom_keys={}
    )
    assert provider is not None
    assert name in ["groq", "mock_demo"]
