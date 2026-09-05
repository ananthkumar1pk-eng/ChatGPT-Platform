"""
Smart Fallback Demo LLM Provider.
Provides rich, realistic streaming AI responses when no external cloud API key is configured.
Ensures zero-friction immediate testing and interactive evaluation.
"""

import asyncio
from typing import AsyncGenerator, List, Dict, Any, Optional
from app.services.llm.base import BaseLLMProvider


class MockDemoProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)

    def get_provider_name(self) -> str:
        return "mock_demo"

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "demo-fast-gpt",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        # Extract last user message and system context
        user_message = ""
        system_context = ""
        for msg in messages:
            if msg.get("role") == "user":
                user_message = msg.get("content", "")
            elif msg.get("role") == "system":
                system_context = msg.get("content", "")

        user_lower = user_message.lower()

        # Check if RAG context was injected
        has_rag_context = "DOCUMENT CONTEXT" in system_context or "RAG" in system_context

        # Domain-specific contextual answers for common queries
        if has_rag_context:
            response_text = (
                f"### Document Analysis & Synthesis\n\n"
                f"Based on the documents indexed in your Knowledge Base, here are the key findings:\n\n"
                f"1. **Direct Summary**: Regarding your query *\"{user_message}\"*, the retrieved passages confirm the relevant structured data, metrics, and procedures.\n"
                f"2. **Detailed Citations**: Review the highlighted source badges below for exact page references and excerpt paragraphs.\n"
                f"3. **Recommendation**: You can upload additional PDF, DOCX, CSV, or TXT documents to broaden this conversation's context window."
            )
        elif any(k in user_lower for k in ["cli vs gui", "difference between cli and gui", "cli and gui", "command line vs gui"]):
            response_text = (
                f"### Comparison: Command Line Interface (CLI) vs. Graphical User Interface (GUI)\n\n"
                f"Both **CLI** and **GUI** are user interfaces that allow humans to communicate with computers and operating systems, but they differ fundamentally in interaction model, resource efficiency, and target use cases:\n\n"
                f"| Feature | Command Line Interface (CLI) | Graphical User Interface (GUI) |\n"
                f"| :--- | :--- | :--- |\n"
                f"| **Interaction** | Text commands typed into a terminal | Visual elements (windows, icons, buttons, menus) via mouse/touch |\n"
                f"| **Ease of Learning** | Steeper learning curve (requires memorizing commands) | Beginner-friendly and intuitive (visual feedback) |\n"
                f"| **Speed & Automation** | Extremely fast for power users; easily scripted/automated with Bash/PowerShell | Slower for repetitive tasks; difficult to automate without scripting tools |\n"
                f"| **Resource Usage** | Extremely lightweight (minimal CPU & RAM) | Higher memory & GPU/graphics overhead |\n"
                f"| **Remote Access** | Fast and resilient over low-bandwidth SSH | Requires heavy remote desktop protocols (RDP/VNC) |\n"
                f"| **Examples** | Bash, PowerShell, zsh, `git`, `docker` | Windows Explorer, macOS Finder, Web Browsers, VS Code |\n\n"
                f"#### Summary & Verdict:\n"
                f"- **Use CLI when**: Deploying cloud servers, managing Docker containers, automating repetitive scripts, or performing developer tasks.\n"
                f"- **Use GUI when**: Designing graphics, casual browsing, multi-window media editing, or when intuitive visual navigation is preferred."
            )
        elif any(k in user_lower for k in ["machine learning", "what is ml", "explain ml", "ai vs ml"]):
            response_text = (
                f"### Understanding Machine Learning (ML)\n\n"
                f"**Machine Learning (ML)** is a subset of Artificial Intelligence (AI) where computational systems learn patterns directly from data to make predictions or decisions without being explicitly rule-programmed.\n\n"
                f"#### Core Paradigms of Machine Learning:\n\n"
                f"1. **Supervised Learning**: Model learns from labeled input-output pairs.\n"
                f"   - *Examples*: Classification (Spam detection), Regression (House price prediction).\n"
                f"   - *Algorithms*: Linear Regression, Random Forests, XGBoost, Neural Networks.\n\n"
                f"2. **Unsupervised Learning**: Discovers hidden structures or clusters in unlabeled data.\n"
                f"   - *Examples*: Customer segmentation, Dimensionality reduction (PCA, t-SNE), Anomaly detection.\n"
                f"   - *Algorithms*: K-Means, DBSCAN, Autoencoders.\n\n"
                f"3. **Reinforcement Learning**: An agent learns optimal actions via reward feedback in an environment.\n"
                f"   - *Examples*: AlphaGo, robotics navigation, autonomous driving, RLHF for LLMs.\n\n"
                f"```python\n"
                f"# Minimal Supervised ML Training Loop (Scikit-Learn)\n"
                f"from sklearn.ensemble import RandomForestClassifier\n"
                f"from sklearn.model_selection import train_test_split\n"
                f"\n"
                f"# 1. Load data & split\n"
                f"X_train, X_test, y_train, y_test = train_test_split(features, labels, test_size=0.2)\n"
                f"\n"
                f"# 2. Train model\n"
                f"clf = RandomForestClassifier(n_estimators=100)\n"
                f"clf.fit(X_train, y_train)\n"
                f"\n"
                f"# 3. Evaluate accuracy\n"
                f"accuracy = clf.score(X_test, y_test)\n"
                f"print(f'Test Accuracy: {accuracy * 100:.2f}%')\n"
                f"```"
            )
        elif any(k in user_lower for k in ["code", "python", "function", "script", "algorithm", "fastapi", "react", "sql"]):
            response_text = (
                f"### Implementation Solution\n\n"
                f"Here is an optimal, production-grade implementation for your request:\n\n"
                f"```python\n"
                f"import asyncio\n"
                f"from typing import List, Dict, Any\n"
                f"from pydantic import BaseModel\n\n"
                f"class TaskRequest(BaseModel):\n"
                f"    query: str\n"
                f"    max_concurrency: int = 5\n\n"
                f"class AsyncPipeline:\n"
                f"    \"\"\"High-performance async pipeline with batching and error handling.\"\"\"\n"
                f"    def __init__(self, name: str = 'ProductionPipeline'):\n"
                f"        self.name = name\n"
                f"        self.semaphore = asyncio.Semaphore(10)\n\n"
                f"    async def process_task(self, item_id: int, payload: str) -> Dict[str, Any]:\n"
                f"        async with self.semaphore:\n"
                f"            await asyncio.sleep(0.02)  # Simulate I/O computation\n"
                f"            return {{\n"
                f"                'id': item_id,\n"
                f"                'status': 'completed',\n"
                f"                'output': f'Processed: {payload}'\n"
                f"            }}\n\n"
                f"async def main():\n"
                f"    pipeline = AsyncPipeline()\n"
                f"    tasks = [pipeline.process_task(i, f'Task #{i}') for i in range(5)]\n"
                f"    results = await asyncio.gather(*tasks)\n"
                f"    print(f'Completed {len(results)} tasks successfully!')\n\n"
                f"if __name__ == '__main__':\n"
                f"    asyncio.run(main())\n"
                f"```\n\n"
                f"#### Architectural Highlights:\n"
                f"- **Concurrency Control**: `asyncio.Semaphore` prevents throttling under heavy load.\n"
                f"- **Type Safety**: Strictly annotated with Pydantic and standard typing hints.\n"
                f"- **Scalability**: Non-blocking event loop execution ensures sub-millisecond overhead."
            )
        elif any(k in user_lower for k in ["hello", "hi", "hey", "who are you", "what can you do"]):
            response_text = (
                f"Hello! 👋 I am **ChatGPT-Platform**, a modern full-stack AI platform built with **Next.js, React, TypeScript, Tailwind CSS, and FastAPI**.\n\n"
                f"### What I can do for you:\n"
                f"- 💬 **Multi-Turn Chat**: Natural conversations with streaming responses and full context memory.\n"
                f"- 📄 **Document RAG**: Upload PDF, DOCX, TXT, CSV, or JSON files to ask questions with source citations.\n"
                f"- ⚡ **Multi-Model Cloud Routing**: Connect directly to **Groq** (Llama 3.3 70B), **OpenAI** (GPT-4o), **Google Gemini 1.5/2.0**, or **Anthropic Claude 3.5**.\n"
                f"- 🎨 **Rich Formatting**: Markdown tables, math equations, and code blocks with syntax highlighting.\n\n"
                f"How can I help you today?"
            )
        else:
            response_text = (
                f"### Explanation & Analysis: *\"{user_message}\"*\n\n"
                f"Here is a comprehensive breakdown addressing your query:\n\n"
                f"#### 1. Core Principles\n"
                f"When evaluating **\"{user_message}\"**, the most important technical factors to consider are **scalability**, **algorithmic efficiency**, and **clear architectural separation**.\n\n"
                f"#### 2. Technical Breakdown\n"
                f"- **Implementation Strategy**: Break the problem down into modular, independently testable components.\n"
                f"- **Data Flow**: Ensure low-latency data pipelines with proper asynchronous handling.\n"
                f"- **Robustness**: Implement input validation, logging, and automated error handling.\n\n"
                f"#### 3. Best Practices\n"
                f"1. Keep functions pure and decoupled.\n"
                f"2. Use vector embeddings and retrieval augmentation for unstructured document data.\n"
                f"3. Monitor token throughput and latency using modern telemetry.\n\n"
                f"> **Tip**: To enable live cloud LLM generation (Groq Llama 3.3 70B, GPT-4o, Claude 3.5, Gemini), open **Settings (⚙️)** in the top right and enter your free API key!"
            )

        # Stream words/tokens with small delay to simulate real LLM generation
        words = response_text.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield chunk
            # 15-20ms per token simulation
            await asyncio.sleep(0.015)

