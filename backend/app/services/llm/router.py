"""
LLM Provider Router and Model Registry.
Dynamically resolves and instantiates the appropriate LLM provider based on user settings,
environment variables, and requested model ID.
"""

from typing import Dict, Any, List, Optional, Tuple
from app.config import settings
from app.services.llm.base import BaseLLMProvider
from app.services.llm.groq_provider import GroqProvider
from app.services.llm.openai_provider import OpenAIProvider
from app.services.llm.gemini_provider import GeminiProvider
from app.services.llm.anthropic_provider import AnthropicProvider
from app.services.llm.openrouter_provider import OpenRouterProvider
from app.services.llm.mock_provider import MockDemoProvider
from app.schemas.user import AvailableModel


# Comprehensive catalog of supported hosted models
SUPPORTED_MODELS: List[AvailableModel] = [
    AvailableModel(
        id="openai/gpt-oss-120b",
        name="GPT OSS 120B",
        provider="groq",
        description="Flagship open reasoning & coding model with ultra-fast Groq LPU inference.",
        context_window="131k",
        is_default=True,
        is_free=True
    ),
    AvailableModel(
        id="qwen/qwen3.6-27b",
        name="Qwen 3.6 27B",
        provider="groq",
        description="High-intelligence reasoning & multimodal model on Groq.",
        context_window="131k",
        is_free=True
    ),
    AvailableModel(
        id="openai/gpt-oss-20b",
        name="GPT OSS 20B",
        provider="groq",
        description="Ultra-low latency reasoning model on Groq.",
        context_window="131k",
        is_free=True
    ),
    AvailableModel(
        id="groq/compound",
        name="Groq Compound",
        provider="groq",
        description="Fast agentic reasoning system on Groq.",
        context_window="131k",
        is_free=True
    ),
    AvailableModel(
        id="llama-3.1-8b-instant",
        name="Llama 3.1 8B (Instant)",
        provider="groq",
        description="Blazing fast lightweight model for rapid responses.",
        context_window="128k",
        is_free=True
    ),
    AvailableModel(
        id="llama-3.3-70b-versatile",
        name="Llama 3.3 70B (Versatile)",
        provider="groq",
        description="State-of-the-art open model on Groq LPUs.",
        context_window="128k",
        is_free=True
    ),
    AvailableModel(
        id="gpt-4o",
        name="GPT-4o",
        provider="openai",
        description="OpenAI's flagship omni model for high reasoning and coding.",
        context_window="128k",
        is_free=False
    ),
    AvailableModel(
        id="gpt-4o-mini",
        name="GPT-4o Mini",
        provider="openai",
        description="Fast, cost-effective multimodal OpenAI intelligence.",
        context_window="128k",
        is_free=False
    ),
    AvailableModel(
        id="gemini-1.5-flash",
        name="Gemini 1.5 Flash",
        provider="gemini",
        description="Google's fast, high-volume model with 1M token context.",
        context_window="1M",
        is_free=True
    ),
    AvailableModel(
        id="gemini-1.5-pro",
        name="Gemini 1.5 Pro",
        provider="gemini",
        description="Google's advanced reasoning model with massive 2M context.",
        context_window="2M",
        is_free=False
    ),
    AvailableModel(
        id="claude-3-5-sonnet-20241022",
        name="Claude 3.5 Sonnet",
        provider="anthropic",
        description="Anthropic's most intelligent model with unmatched coding abilities.",
        context_window="200k",
        is_free=False
    ),
    AvailableModel(
        id="meta-llama/llama-3.3-70b-instruct",
        name="Llama 3.3 70B (OpenRouter)",
        provider="openrouter",
        description="Universal hosted router access to Llama 3.3.",
        context_window="128k",
        is_free=False
    ),
    AvailableModel(
        id="demo-fast-gpt",
        name="Smart Demo Mode",
        provider="mock_demo",
        description="Built-in zero-config interactive AI assistant (No API key needed).",
        context_window="32k",
        is_free=True
    )
]


class LLMRouter:
    @staticmethod
    def get_supported_models() -> List[AvailableModel]:
        """Return list of all registered models."""
        return SUPPORTED_MODELS

    @staticmethod
    def resolve_provider(
        provider_name: Optional[str] = None,
        model_name: Optional[str] = None,
        user_custom_keys: Optional[Dict[str, str]] = None
    ) -> Tuple[BaseLLMProvider, str, str]:
        """
        Resolves provider, model, and active API key.
        Returns (provider_instance, resolved_model, resolved_provider_name).
        """
        custom_keys = user_custom_keys or {}

        # 1. Determine model and provider
        req_model = model_name or settings.DEFAULT_MODEL
        req_provider = provider_name

        # If provider not explicitly given, look up by model ID
        if not req_provider:
            for m in SUPPORTED_MODELS:
                if m.id == req_model:
                    req_provider = m.provider
                    break

        if not req_provider:
            req_provider = settings.DEFAULT_PROVIDER

        # 2. Extract API Key (User custom key takes precedence over server .env key)
        api_key = None
        if req_provider == "groq":
            api_key = custom_keys.get("groq") or settings.GROQ_API_KEY
            if api_key:
                return GroqProvider(api_key=api_key), req_model, "groq"

        elif req_provider == "openai":
            api_key = custom_keys.get("openai") or settings.OPENAI_API_KEY
            if api_key:
                return OpenAIProvider(api_key=api_key), req_model, "openai"

        elif req_provider == "gemini":
            api_key = custom_keys.get("gemini") or settings.GEMINI_API_KEY
            if api_key:
                return GeminiProvider(api_key=api_key), req_model, "gemini"

        elif req_provider == "anthropic":
            api_key = custom_keys.get("anthropic") or settings.ANTHROPIC_API_KEY
            if api_key:
                return AnthropicProvider(api_key=api_key), req_model, "anthropic"

        elif req_provider == "openrouter":
            api_key = custom_keys.get("openrouter") or settings.OPENROUTER_API_KEY
            if api_key:
                return OpenRouterProvider(api_key=api_key), req_model, "openrouter"

        # 3. If no valid key was found, check if ANY server key is available to use as fallback
        if settings.GROQ_API_KEY:
            return GroqProvider(api_key=settings.GROQ_API_KEY), "openai/gpt-oss-120b", "groq"
        if settings.OPENAI_API_KEY:
            return OpenAIProvider(api_key=settings.OPENAI_API_KEY), "gpt-4o-mini", "openai"
        if settings.GEMINI_API_KEY:
            return GeminiProvider(api_key=settings.GEMINI_API_KEY), "gemini-1.5-flash", "gemini"

        # 4. Fallback to Smart Mock Demo Provider
        return MockDemoProvider(), "demo-fast-gpt", "mock_demo"
