"""
Groq Hosted LLM Inference Provider.
Provides ultra-low latency streaming inference for models like Llama-3.3-70B, Mixtral, and Gemma.
"""

import json
from typing import AsyncGenerator, List, Dict, Any, Optional
import httpx
from app.services.llm.base import BaseLLMProvider


class GroqProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    def get_provider_name(self) -> str:
        return "groq"

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            raise ValueError("Groq API Key is not configured. Please add your GROQ_API_KEY in Settings.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        models_to_try = [model]
        groq_active_defaults = [
            "openai/gpt-oss-120b",
            "qwen/qwen3.6-27b",
            "openai/gpt-oss-20b",
            "groq/compound",
            "llama-3.1-8b-instant",
        ]
        for gm in groq_active_defaults:
            if gm not in models_to_try:
                models_to_try.append(gm)

        last_error = None
        for current_model in models_to_try:
            payload = {
                "model": current_model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True
            }

            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream("POST", self.base_url, headers=headers, json=payload) as response:
                        if response.status_code == 200:
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
                            return
                        else:
                            error_body = (await response.aread()).decode('utf-8', errors='ignore')
                            last_error = f"Groq API error ({response.status_code}): {error_body}"
                            # If model is decommissioned, not found, or inaccessible, try next candidate
                            if response.status_code in [400, 404] and any(
                                tag in error_body for tag in ["model_not_found", "model_decommissioned", "does not exist", "invalid_request_error"]
                            ):
                                continue
                            else:
                                raise RuntimeError(last_error)
            except httpx.RequestError as e:
                last_error = f"Groq network error: {str(e)}"
                continue

        if last_error:
            raise RuntimeError(last_error)


