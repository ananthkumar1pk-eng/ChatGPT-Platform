"""
Groq Hosted LLM Inference Provider.
Provides ultra-low latency streaming inference for active Groq models:
- openai/gpt-oss-120b (Flagship Reasoning & Coding)
- openai/gpt-oss-20b (Instant Ultra-Low Latency)
- qwen/qwen3.8-27b & qwen3.6-27b (Multimodal & Intelligence)
- groq/compound

Includes robust <think> tag filtration and safe token limits (600 max) to prevent 429 rate limit errors.
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
        model: str = "openai/gpt-oss-120b",
        temperature: float = 0.6,
        max_tokens: int = 600,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            raise ValueError("Groq API Key is not configured. Please add your GROQ_API_KEY in Settings.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Keep safe max tokens under 600 to strictly comply with Groq on-demand rate limits
        safe_max_tokens = min(int(max_tokens or 600), 600)

        # Map decommissioned or requested models to active high-performing Groq models
        model_alias_map = {
            "llama-3.3-70b-versatile": "qwen/qwen3.8-27b",
            "llama-3.1-70b-versatile": "qwen/qwen3.8-27b",
            "llama-3.1-8b-instant": "openai/gpt-oss-20b",
            "mixtral-8x7b-32768": "qwen/qwen3.6-27b",
        }
        resolved_first_model = model_alias_map.get(model, model)
        models_to_try = [resolved_first_model]
        groq_active_defaults = [
            "qwen/qwen3.8-27b",
            "openai/gpt-oss-120b",
            "groq/compound",
            "openai/gpt-oss-20b",
            "qwen/qwen3.6-27b",
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
                "max_tokens": safe_max_tokens,
                "stream": True
            }

            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream("POST", self.base_url, headers=headers, json=payload) as response:
                        if response.status_code == 200:
                            inside_think = False
                            think_buffer = ""

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
                                            raw_content = delta.get("content") or ""
                                            if not raw_content:
                                                continue

                                            # Filter out <think> ... </think> blocks
                                            if not inside_think:
                                                if "<think>" in raw_content:
                                                    pre, post = raw_content.split("<think>", 1)
                                                    inside_think = True
                                                    think_buffer = post
                                                    if pre:
                                                        yield pre
                                                elif raw_content.startswith("<think"):
                                                    inside_think = True
                                                    think_buffer = raw_content
                                                else:
                                                    yield raw_content
                                            else:
                                                think_buffer += raw_content
                                                if "</think>" in think_buffer:
                                                    _, post = think_buffer.split("</think>", 1)
                                                    inside_think = False
                                                    think_buffer = ""
                                                    clean_post = post.lstrip("\n")
                                                    if clean_post:
                                                        yield clean_post
                                    except json.JSONDecodeError:
                                        continue
                            return
                        else:
                            error_body = (await response.aread()).decode('utf-8', errors='ignore')
                            last_error = f"Groq API error ({response.status_code}): {error_body}"
                            
                            # If 429 rate limit or model not found, try next candidate
                            if response.status_code in [400, 404, 429] or any(
                                tag in error_body for tag in [
                                    "rate_limit_exceeded", "Limit 1000", "OTPM", "model_not_found",
                                    "model_decommissioned", "does not exist", "invalid_request_error"
                                ]
                            ):
                                continue
                            else:
                                raise RuntimeError(last_error)
            except httpx.RequestError as e:
                last_error = f"Groq network error: {str(e)}"
                continue

        if last_error:
            raise RuntimeError(last_error)
