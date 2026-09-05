"""
Abstract Base Class for Hosted LLM Inference Providers.
"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any, Optional


class BaseLLMProvider(ABC):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    @abstractmethod
    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """
        Stream LLM tokens asynchronously.
        Yields individual text token chunks as they arrive from the hosted service.
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns provider identifier name."""
        pass
