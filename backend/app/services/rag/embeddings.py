"""
Embedding and Vector Representation Service.
Supports OpenAI hosted embeddings and high-speed TF-IDF semantic vector representation.
"""

from typing import List, Optional
import numpy as np
import httpx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.config import settings


class EmbeddingService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY

    async def get_hosted_embeddings(self, texts: List[str]) -> Optional[List[List[float]]]:
        """Fetch OpenAI hosted embeddings if key is configured."""
        if not self.api_key:
            return None

        try:
            url = "https://api.openai.com/v1/embeddings"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "text-embedding-3-small",
                "input": texts
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return [item["embedding"] for item in data.get("data", [])]
        except Exception:
            pass
        return None

    @staticmethod
    def compute_local_similarity(query: str, corpus: List[str]) -> List[float]:
        """
        Computes cosine similarity between query and corpus using TF-IDF sublinear scaling.
        Returns a list of similarity scores in [0.0, 1.0].
        """
        if not corpus:
            return []

        all_docs = [query] + corpus
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words="english"
        )
        try:
            tfidf_matrix = vectorizer.fit_transform(all_docs)
            query_vec = tfidf_matrix[0:1]
            corpus_vecs = tfidf_matrix[1:]
            scores = cosine_similarity(query_vec, corpus_vecs)[0]
            return scores.tolist()
        except Exception:
            # Fallback simple keyword overlap ratio
            q_words = set(query.lower().split())
            scores = []
            for doc in corpus:
                d_words = set(doc.lower().split())
                inter = len(q_words.intersection(d_words))
                scores.append(inter / max(1, len(q_words)))
            return scores
