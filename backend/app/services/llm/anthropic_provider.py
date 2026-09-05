"""
Anthropic Claude Hosted LLM Inference Provider.
Provides streaming inference for Claude 3.5 Sonnet, Claude 3 Haiku, and Claude 3 Opus.
"""

import json
from typing import AsyncGenerator, List, Dict, Any, Optional, Tuple
import httpx
from app.services.llm.base import BaseLLMProvider


class AnthropicProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        self.base_url = "https://api.anthropic.com/v1/messages"

    def get_provider_name(self) -> str:
        return "anthropic"

    def _convert_messages(self, messages: List[Dict[str, str]]) -> Tuple[Optional[str], List[Dict[str, str]]]:
        system_prompt = None
        converted = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                system_prompt = content
            else:
                converted.append({"role": role, "content": content})
        return system_prompt, converted

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "claude-3-5-sonnet-20241022",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            raise ValueError("Anthropic API Key is not configured. Please add your ANTHROPIC_API_KEY in Settings.")

        system_prompt, converted_messages = self._convert_messages(messages)

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

        payload: Dict[str, Any] = {
            "model": model,
            "messages": converted_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": True
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", self.base_url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    error_body = await response.aread()
                    raise RuntimeError(f"Anthropic API error ({response.status_code}): {error_body.decode('utf-8')}")

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        try:
                            chunk = json.loads(data_str)
                            event_type = chunk.get("type")
                            if event_type == "content_block_delta":
                                delta = chunk.get("delta", {})
                                if delta.get("type") == "text_delta":
                                    yield delta.get("text", "")
                        except json.JSONDecodeError:
                            continue
