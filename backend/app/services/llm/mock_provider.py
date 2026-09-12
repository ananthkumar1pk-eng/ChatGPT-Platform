"""
Smart Fallback Demo LLM Provider.
Provides rich, realistic, question-tailored streaming AI responses when no external cloud API key is configured.
Adapts answer length strictly to the question, avoiding repetitive boilerplate and generic fluff.
"""

import asyncio
import re
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
        temperature: float = 0.6,
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

        user_clean = user_message.strip()
        user_lower = user_clean.lower()

        # Check if RAG context was injected
        has_rag_context = "DOCUMENT CONTEXT" in system_context or "RAG" in system_context

        # 1. RAG Query
        if has_rag_context:
            response_text = (
                f"### Document Findings\n\n"
                f"Based on the indexed document context for **\"{user_clean}\"**:\n\n"
                f"- **Core Answer**: The verified records and document chunks confirm the relevant procedures and specifications.\n"
                f"- **Source Citations**: Check the highlighted citations below for the exact source excerpts."
            )

        # 2. Greetings
        elif user_lower in ["hello", "hi", "hey", "greetings", "hello!"]:
            response_text = "Hello! How can I help you today?"

        # 3. Simple math / brief queries
        elif re.match(r"^what is \d+\s*[\+\-\*\/]\s*\d+\??$", user_lower):
            try:
                expr = re.search(r"\d+\s*[\+\-\*\/]\s*\d+", user_lower).group(0)
                ans = eval(expr)
                response_text = f"**{expr} = {ans}**"
            except Exception:
                response_text = f"The result of {user_clean} is computed directly."

        # 4. Who created / what is Python
        elif "who created python" in user_lower or "creator of python" in user_lower:
            response_text = "Python was created by **Guido van Rossum** and first released in **1991**."

        # 5. Linux list files
        elif any(k in user_lower for k in ["list files in linux", "linux command to list files", "how to list files in terminal"]):
            response_text = (
                "To list files in Linux or macOS, use the `ls` command:\n\n"
                "```bash\n"
                "ls -la    # Lists all files including hidden ones with permissions and sizes\n"
                "```"
            )

        # 6. Comparisons (CLI vs GUI, SQL vs NoSQL, REST vs GraphQL)
        elif any(k in user_lower for k in ["cli vs gui", "difference between cli and gui", "cli and gui"]):
            response_text = (
                "### Comparison: CLI vs. GUI\n\n"
                "| Feature | Command Line Interface (CLI) | Graphical User Interface (GUI) |\n"
                "| :--- | :--- | :--- |\n"
                "| **Interaction** | Text commands in terminal | Visual elements (windows, buttons) via mouse/touch |\n"
                "| **Learning Curve** | Steep (commands must be memorized) | Intuitive and beginner-friendly |\n"
                "| **Automation** | Easily scripted via Bash/PowerShell | Difficult to automate without specialized tools |\n"
                "| **Resource Usage** | Minimal CPU & RAM | Higher memory & GPU rendering overhead |\n"
                "| **Primary Use Cases** | Cloud servers, DevOps, development | Desktop applications, design, browsing |\n\n"
                "**Summary**: Use **CLI** for speed, scripting, and server administration. Use **GUI** for visual design, complex media, and intuitive desktop navigation."
            )

        elif any(k in user_lower for k in ["sql vs nosql", "difference between sql and nosql"]):
            response_text = (
                "### Comparison: SQL vs. NoSQL Databases\n\n"
                "| Feature | SQL (Relational) | NoSQL (Non-Relational) |\n"
                "| :--- | :--- | :--- |\n"
                "| **Schema** | Rigid, predefined tabular schema | Dynamic, flexible (document, key-value, graph) |\n"
                "| **Scaling** | Vertically (strong ACID guarantees) | Horizontally (distributed partitioning) |\n"
                "| **Query Language** | Structured Query Language (SQL) | JSON-based APIs / specialized query syntax |\n"
                "| **Examples** | PostgreSQL, MySQL, SQLite | MongoDB, Redis, Cassandra, DynamoDB |\n\n"
                "**Summary**: Choose **SQL** for relational integrity and financial transactions; choose **NoSQL** for unstructured data, high-throughput caching, and rapid schema evolution."
            )

        # 7. Machine Learning explanation
        elif any(k in user_lower for k in ["machine learning", "what is ml", "explain ml", "ai vs ml"]):
            response_text = (
                "### Machine Learning (ML)\n\n"
                "**Machine Learning** is a branch of AI where computational systems learn patterns from data to make predictions or decisions without explicit rule-based programming.\n\n"
                "#### Three Main Types:\n"
                "1. **Supervised Learning**: Trains on labeled data (e.g., classification, regression).\n"
                "2. **Unsupervised Learning**: Discovers hidden structure in unlabeled data (e.g., clustering, PCA).\n"
                "3. **Reinforcement Learning**: Learns optimal strategies through environmental reward feedback.\n\n"
                "```python\n"
                "from sklearn.ensemble import RandomForestClassifier\n"
                "\n"
                "# Train a supervised classifier\n"
                "clf = RandomForestClassifier(n_estimators=100)\n"
                "clf.fit(X_train, y_train)\n"
                "accuracy = clf.score(X_test, y_test)\n"
                "print(f'Accuracy: {accuracy * 100:.1f}%')\n"
                "```"
            )

        # 8. Code implementation requests
        elif any(k in user_lower for k in ["python script", "code example", "fastapi example", "write a function", "react component"]):
            response_text = (
                "Here is a clean, typed implementation for your request:\n\n"
                "```python\n"
                "import asyncio\n"
                "from typing import List, Dict, Any\n\n"
                "async def fetch_item(item_id: int) -> Dict[str, Any]:\n"
                "    \"\"\"Simulate async data fetching.\"\"\"\n"
                "    await asyncio.sleep(0.05)\n"
                "    return {'id': item_id, 'status': 'success'}\n\n"
                "async def main():\n"
                "    tasks = [fetch_item(i) for i in range(1, 6)]\n"
                "    results = await asyncio.gather(*tasks)\n"
                "    print(f'Fetched {len(results)} items successfully.')\n\n"
                "if __name__ == '__main__':\n"
                "    asyncio.run(main())\n"
                "```"
            )

        # 9. Adaptive General Answer
        else:
            # If user message is short, give a focused, direct answer
            if len(user_clean.split()) <= 6:
                response_text = (
                    f"Regarding **{user_clean}**:\n\n"
                    f"To assist you precisely, please let me know if you would like a code implementation, a comparative table, or an architectural breakdown."
                )
            else:
                response_text = (
                    f"### {user_clean.capitalize()}\n\n"
                    f"Here is the direct analysis addressing your inquiry:\n\n"
                    f"- **Key Concept**: When addressing this requirement, the primary objective is clarity, efficiency, and adherence to established standards.\n"
                    f"- **Actionable Step**: Review the relevant system configurations or implementation parameters to achieve optimal results."
                )

        # Stream words/tokens with small delay
        words = response_text.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield chunk
            await asyncio.sleep(0.015)
