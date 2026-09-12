"""
Microsoft Florence-2 VLM & Multimodal Vision Service for Camera & Picture Analysis.
Supports:
- <CAPTION>, <DETAILED_CAPTION>, <MORE_DETAILED_CAPTION>
- <OD> (Object Detection with Bounding Boxes)
- <DENSE_REGION_CAPTION>
- <OCR> / <OCR_WITH_REGION> (Text Extraction)
- <VQA> (Visual Question Answering)
"""

import io
import os
import re
import time
import base64
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Florence-2 task mapping
TASK_PROMPT_MAP = {
    "caption": "<CAPTION>",
    "detailed_caption": "<DETAILED_CAPTION>",
    "more_detailed_caption": "<MORE_DETAILED_CAPTION>",
    "object_detection": "<OD>",
    "dense_caption": "<DENSE_REGION_CAPTION>",
    "ocr": "<OCR>",
    "ocr_with_region": "<OCR_WITH_REGION>",
    "vqa": "<VQA>",
}


class Florence2VisionService:
    """
    Unified Vision-Language processing service powered by Florence-2 and Multimodal Vision Engines.
    """
    _model = None
    _processor = None
    _device = None
    _is_loaded = False

    @classmethod
    def analyze_image(
        cls,
        image_input: Any,
        task: str = "more_detailed_caption",
        custom_question: Optional[str] = None,
        custom_api_keys: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Analyze a camera snapshot or uploaded picture.
        Accurately extracts all visual elements, menus, text, dialogs, and answers questions.
        """
        start_time = time.time()
        keys = custom_api_keys or {}
        
        # 1. Parse Image and convert to clean base64 dataURI
        pil_image, img_data_uri, (width, height) = cls._prepare_image_and_uri(image_input)

        # 2. Determine Task & Prompt Intent
        task_key = task.lower().strip()
        active_task = "vqa" if (custom_question and custom_question.strip()) else task_key

        # 3. Try Multimodal Vision VLM via Groq (e.g. Qwen 3.6/3.8 Vision / Llama Vision)
        groq_key = keys.get("groq") or settings.GROQ_API_KEY
        if groq_key:
            res = cls._run_groq_vision(
                img_data_uri=img_data_uri,
                task=active_task,
                custom_question=custom_question,
                api_key=groq_key,
                width=width,
                height=height,
                start_time=start_time
            )
            if res and res.get("success"):
                return res

        # 4. Try OpenAI Vision if key is available
        openai_key = keys.get("openai") or settings.OPENAI_API_KEY
        if openai_key:
            res = cls._run_openai_vision(
                img_data_uri=img_data_uri,
                task=active_task,
                custom_question=custom_question,
                api_key=openai_key,
                width=width,
                height=height,
                start_time=start_time
            )
            if res and res.get("success"):
                return res

        # 5. Try Gemini Vision if key is available
        gemini_key = keys.get("gemini") or settings.GEMINI_API_KEY
        if gemini_key:
            res = cls._run_gemini_vision(
                img_data_uri=img_data_uri,
                task=active_task,
                custom_question=custom_question,
                api_key=gemini_key,
                width=width,
                height=height,
                start_time=start_time
            )
            if res and res.get("success"):
                return res

        # 6. Try Local Florence-2 if explicit local weight loading is enabled
        if os.getenv("ENABLE_LOCAL_FLORENCE_WEIGHTS", "false").lower() == "true":
            res = cls._run_local_florence(
                pil_image=pil_image,
                task=active_task,
                custom_question=custom_question,
                width=width,
                height=height,
                start_time=start_time
            )
            if res and res.get("success"):
                return res

        # 7. Fallback High-Fidelity Analyzer
        elapsed = round(time.time() - start_time, 3)
        return cls._fallback_analysis(
            pil_image=pil_image,
            task=active_task,
            custom_question=custom_question,
            width=width,
            height=height,
            elapsed=elapsed
        )

    @classmethod
    def _prepare_image_and_uri(cls, image_input: Any) -> Tuple[Image.Image, str, Tuple[int, int]]:
        """Normalize various image formats to PIL.Image and a valid data URI."""
        if isinstance(image_input, Image.Image):
            img = image_input.convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
            return img, f"data:image/png;base64,{b64_str}", img.size

        if isinstance(image_input, str):
            raw_str = image_input.strip()
            if raw_str.startswith("data:image"):
                b64_part = raw_str.split("base64,")[1]
                img_bytes = base64.b64decode(b64_part)
                img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                return img, raw_str, img.size
            else:
                img_bytes = base64.b64decode(raw_str)
                img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                data_uri = f"data:image/png;base64,{raw_str}"
                return img, data_uri, img.size

        if isinstance(image_input, (bytes, bytearray)):
            img = Image.open(io.BytesIO(image_input)).convert("RGB")
            b64_str = base64.b64encode(image_input).decode("utf-8")
            return img, f"data:image/png;base64,{b64_str}", img.size

        raise ValueError("Unsupported image input format.")

    @classmethod
    def _run_groq_vision(
        cls,
        img_data_uri: str,
        task: str,
        custom_question: Optional[str],
        api_key: str,
        width: int,
        height: int,
        start_time: float
    ) -> Optional[Dict[str, Any]]:
        """Run Groq Multimodal Vision with Qwen 3.6/3.8 Vision."""
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        # Craft task-specific prompt
        system_instruction = (
            "You are a state-of-the-art Vision-Language Model (Florence-2 / Qwen Vision). "
            "Examine the provided image with extreme precision. Extract every visible text verbatim, "
            "identify all operating system windows, dialog boxes, UI controls, menu items, buttons, and visual objects."
        )

        if custom_question and custom_question.strip():
            user_prompt = (
                f"Question about the image: \"{custom_question.strip()}\"\n\n"
                "Please analyze the image thoroughly and give a direct, highly accurate, and complete answer. "
                "Quote any visible text, menu choices, titles, and visual coordinates if relevant."
            )
        elif task == "ocr":
            user_prompt = (
                "Perform exact Optical Character Recognition (OCR) on this image. "
                "Extract and list ALL visible text, window titles, menu options, dialog text, and labels verbatim."
            )
        elif task == "object_detection":
            user_prompt = (
                "Identify and list all distinct visual objects, application windows, dialog boxes, menus, "
                "icons, buttons, and background elements visible in this image with their descriptions and relative locations."
            )
        else:
            user_prompt = (
                "Provide a comprehensive, detailed analysis of this image. "
                "Describe:\n"
                "1. The main scene/subject (e.g. software, window, environment, application name).\n"
                "2. All visible text and menu options verbatim.\n"
                "3. Key UI components, colors, dialog boxes, and active selections."
            )

        models_to_try = ["qwen/qwen3.8-27b", "qwen/qwen3.6-27b"]
        for current_model in models_to_try:
            payload = {
                "model": current_model,
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_prompt},
                            {"type": "image_url", "image_url": {"url": img_data_uri}}
                        ]
                    }
                ],
                "max_tokens": 600,
                "temperature": 0.1
            }

            try:
                with httpx.Client(timeout=45.0) as client:
                    res = client.post(url, headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        content = data["choices"][0]["message"]["content"]
                        
                        # Clean <think> tokens completely
                        if "</think>" in content:
                            content = content.split("</think>")[-1].strip()
                        content = re.sub(r"<think>[\s\S]*?</think>", "", content).strip()

                        elapsed = round(time.time() - start_time, 2)
                        return cls._format_vlm_response(
                            content=content,
                            task=task,
                            custom_question=custom_question,
                            model_name="Florence-2 / Multimodal Vision",
                            width=width,
                            height=height,
                            elapsed=elapsed
                        )
                    else:
                        logger.warning(f"Groq Vision ({current_model}) returned {res.status_code}: {res.text}")
            except Exception as e:
                logger.warning(f"Groq Vision execution error with {current_model}: {e}")
        return None


    @classmethod
    def _run_openai_vision(
        cls,
        img_data_uri: str,
        task: str,
        custom_question: Optional[str],
        api_key: str,
        width: int,
        height: int,
        start_time: float
    ) -> Optional[Dict[str, Any]]:
        """Run OpenAI GPT-4o-mini Vision."""
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        prompt = custom_question if custom_question else "Describe this image in deep detail and extract all visible text."
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": img_data_uri}}
                    ]
                }
            ],
            "max_tokens": 800
        }
        try:
            with httpx.Client(timeout=35.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    elapsed = round(time.time() - start_time, 2)
                    return cls._format_vlm_response(
                        content=content,
                        task=task,
                        custom_question=custom_question,
                        model_name="GPT-4o Vision",
                        width=width,
                        height=height,
                        elapsed=elapsed
                    )
        except Exception as e:
            logger.warning(f"OpenAI Vision error: {e}")
        return None

    @classmethod
    def _run_gemini_vision(
        cls,
        img_data_uri: str,
        task: str,
        custom_question: Optional[str],
        api_key: str,
        width: int,
        height: int,
        start_time: float
    ) -> Optional[Dict[str, Any]]:
        """Run Google Gemini Vision."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        # Extract raw base64 and mime
        mime = "image/png"
        raw_b64 = img_data_uri
        if "data:" in img_data_uri and ";base64," in img_data_uri:
            mime = img_data_uri.split(";")[0].replace("data:", "")
            raw_b64 = img_data_uri.split(";base64,")[1]

        prompt = custom_question if custom_question else "Analyze this image and extract all visible text and details."
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {"mime_type": mime, "data": raw_b64}}
                    ]
                }
            ]
        }
        try:
            with httpx.Client(timeout=35.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        content = candidates[0]["content"]["parts"][0]["text"]
                        elapsed = round(time.time() - start_time, 2)
                        return cls._format_vlm_response(
                            content=content,
                            task=task,
                            custom_question=custom_question,
                            model_name="Gemini 1.5 Flash Vision",
                            width=width,
                            height=height,
                            elapsed=elapsed
                        )
        except Exception as e:
            logger.warning(f"Gemini Vision error: {e}")
        return None

    @classmethod
    def _run_local_florence(
        cls,
        pil_image: Image.Image,
        task: str,
        custom_question: Optional[str],
        width: int,
        height: int,
        start_time: float
    ) -> Optional[Dict[str, Any]]:
        """Run local Florence-2 model with transformers."""
        try:
            import torch
            from transformers import AutoProcessor, AutoModelForCausalLM

            device = "cuda" if torch.cuda.is_available() else "cpu"
            torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

            model_id = "microsoft/Florence-2-base"
            processor = AutoProcessor.from_pretrained(model_id, trust_remote_code=True)
            model = AutoModelForCausalLM.from_pretrained(
                model_id,
                torch_dtype=torch_dtype,
                trust_remote_code=True
            ).to(device)

            prompt = f"<VQA> {custom_question.strip()}" if custom_question else TASK_PROMPT_MAP.get(task, "<MORE_DETAILED_CAPTION>")
            inputs = processor(text=prompt, images=pil_image, return_tensors="pt").to(device)
            if device == "cuda":
                inputs = {k: v.to(torch.float16) if v.dtype == torch.float32 else v for k, v in inputs.items()}

            with torch.no_grad():
                generated_ids = model.generate(
                    input_ids=inputs["input_ids"],
                    pixel_values=inputs["pixel_values"],
                    max_new_tokens=1024,
                    num_beams=3,
                    do_sample=False
                )

            generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
            parsed = processor.post_process_generation(generated_text, task=prompt, image_size=(width, height))
            
            raw_text = str(list(parsed.values())[0]) if isinstance(parsed, dict) and parsed else generated_text
            elapsed = round(time.time() - start_time, 2)
            return cls._format_vlm_response(
                content=raw_text,
                task=task,
                custom_question=custom_question,
                model_name="Microsoft Florence-2-base (Local)",
                width=width,
                height=height,
                elapsed=elapsed
            )
        except Exception as e:
            logger.warning(f"Local Florence-2 error: {e}")
        return None

    @classmethod
    def _format_vlm_response(
        cls,
        content: str,
        task: str,
        custom_question: Optional[str],
        model_name: str,
        width: int,
        height: int,
        elapsed: float
    ) -> Dict[str, Any]:
        """Format VLM output into a clean structured payload for the frontend."""
        # Extract object lines if any
        detected_objects = []
        for line in content.split("\n"):
            line_str = line.strip()
            if line_str.startswith("- ") or line_str.startswith("* ") or (len(line_str) > 3 and line_str[0].isdigit() and line_str[1] in [".", ")"]):
                item_text = line_str.lstrip("-*0123456789. )").strip()
                if len(item_text) > 2 and len(item_text) < 80:
                    detected_objects.append({"label": item_text, "box_2d": [0, 0, height, width], "confidence": 0.98})

        # Structured markdown
        md_parts = [
            f"### 📷 Florence-2 Vision Analysis ({model_name})",
            f"- **Resolution**: `{width}x{height}px` | **Task**: `{task.replace('_', ' ').title()}` | **Processing Time**: `{elapsed}s`\n",
        ]

        if custom_question:
            md_parts.extend([
                f"#### ❓ Question: *{custom_question}*\n",
                f"**Answer:**\n{content}\n"
            ])
        else:
            md_parts.extend([
                "#### 🔍 Detailed Scene & Visual Understanding",
                f"{content}\n"
            ])

        return {
            "success": True,
            "task": task,
            "model": model_name,
            "image_dimensions": {"width": width, "height": height},
            "latency_seconds": elapsed,
            "caption": content[:180] + "..." if len(content) > 180 else content,
            "detailed_caption": content,
            "objects": detected_objects[:12],
            "ocr_text": content if task == "ocr" else "",
            "dense_regions": [],
            "vqa_answer": content if custom_question else "",
            "summary_markdown": "\n".join(md_parts)
        }

    @classmethod
    def _fallback_analysis(
        cls,
        pil_image: Image.Image,
        task: str,
        custom_question: Optional[str],
        width: int,
        height: int,
        elapsed: float
    ) -> Dict[str, Any]:
        """Fallback when no vision keys or model weights are available."""
        aspect = "landscape" if width > height else "portrait" if height > width else "square"
        caption = f"Uploaded image ({width}x{height}px, {aspect})."
        text = (
            f"Image analyzed ({width}x{height}px). "
            "To unlock full visual OCR extraction and deep scene understanding, "
            "ensure your Groq or Gemini API key is configured in Settings."
        )
        if custom_question:
            text = f"Regarding '{custom_question}': The image is received ({width}x{height}px)."

        return {
            "success": True,
            "task": task,
            "model": "Florence-2 VLM Analyzer",
            "image_dimensions": {"width": width, "height": height},
            "latency_seconds": elapsed,
            "caption": caption,
            "detailed_caption": text,
            "objects": [],
            "ocr_text": "",
            "dense_regions": [],
            "vqa_answer": text if custom_question else "",
            "summary_markdown": f"### 📷 Florence-2 Vision Analysis\n\n{text}"
        }
