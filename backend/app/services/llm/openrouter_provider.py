"""
OpenRouter Hosted LLM Inference Provider.
Provides universal access to 100+ hosted models (Llama 3, Mistral, Qwen, DeepSeek, Claude, GPT-4o) with one unified API.
"""

import json
from typing import AsyncGenerator, List, Dict, Any, Optional
import httpx
from app.services.llm.base import BaseLLMProvider


class OpenRouterProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

    def get_provider_name(self) -> str:
        return "openrouter"

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "meta-llama/llama-3.3-70b-instruct",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            raise ValueError("OpenRouter API Key is not configured. Please add your OPENROUTER_API_KEY in Settings.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://chatgpt-platform.local",
            "X-Title": "ChatGPT-Platform",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", self.base_url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    error_body = await response.aread()
                    raise RuntimeError(f"OpenRouter API error ({response.status_code}): {error_body.decode('utf-8')}")

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            choices = chunk.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue
