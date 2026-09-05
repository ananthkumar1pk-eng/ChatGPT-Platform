"""
Google Gemini Hosted LLM Inference Provider.
Provides streaming inference for Gemini 1.5 Flash, Gemini 1.5 Pro, and Gemini 2.0.
"""

import json
from typing import AsyncGenerator, List, Dict, Any, Optional, Tuple
import httpx
from app.services.llm.base import BaseLLMProvider


class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)

    def get_provider_name(self) -> str:
        return "gemini"

    def _convert_messages(self, messages: List[Dict[str, str]]) -> Tuple[Optional[str], List[Dict[str, Any]]]:
        system_instruction = None
        contents = []

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if role == "system":
                system_instruction = content
            elif role == "user":
                contents.append({
                    "role": "user",
                    "parts": [{"text": content}]
                })
            elif role == "assistant":
                contents.append({
                    "role": "model",
                    "parts": [{"text": content}]
                })

        return system_instruction, contents

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "gemini-1.5-flash",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            raise ValueError("Google Gemini API Key is not configured. Please add your GEMINI_API_KEY in Settings.")

        # Normalize model name
        clean_model = model if model.startswith("gemini-") else f"gemini-{model}"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:streamGenerateContent?key={self.api_key}&alt=sse"

        system_instruction, contents = self._convert_messages(messages)

        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens
            }
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        headers = {"Content-Type": "application/json"}

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    error_body = await response.aread()
                    raise RuntimeError(f"Gemini API error ({response.status_code}): {error_body.decode('utf-8')}")

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        try:
                            chunk = json.loads(data_str)
                            candidates = chunk.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                for part in parts:
                                    text = part.get("text", "")
                                    if text:
                                        yield text
                        except json.JSONDecodeError:
                            continue
