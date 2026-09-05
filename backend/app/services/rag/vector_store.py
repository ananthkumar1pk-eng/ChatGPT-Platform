"""
Vector Store and Hybrid RAG Retrieval Engine.
Retrieves top relevant chunks from user documents and generates context and source citations.
"""

from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document import Document, DocumentChunk
from app.services.rag.embeddings import EmbeddingService
from app.schemas.chat import SourceCitation


class VectorStoreService:
    def __init__(self, db: AsyncSession, embedding_service: Optional[EmbeddingService] = None):
        self.db = db
        self.embedding_service = embedding_service or EmbeddingService()

    async def search_relevant_chunks(
        self,
        user_id: str,
        query: str,
        top_k: int = 4,
        document_ids: Optional[List[str]] = None,
        min_score: float = 0.05
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top relevant document chunks for a query.
        Returns list of matching chunk metadata and similarity score.
        """
        # 1. Fetch chunks belonging to the user
        stmt = (
            select(DocumentChunk, Document.filename, Document.file_type)
            .join(Document, DocumentChunk.document_id == Document.id)
            .where(Document.user_id == user_id)
        )
        if document_ids:
            stmt = stmt.where(Document.id.in_(document_ids))

        res = await self.db.execute(stmt)
        rows = res.all()

        if not rows:
            return []

        # 2. Extract contents
        corpus = [row[0].content for row in rows]

        # 3. Compute similarities
        scores = self.embedding_service.compute_local_similarity(query, corpus)

        # 4. Pair and sort
        ranked = []
        for i, (chunk, filename, file_type) in enumerate(rows):
            score = scores[i]
            if score >= min_score:
                # Generate clean snippet
                snippet = self._generate_snippet(query, chunk.content)
                ranked.append({
                    "document_id": chunk.document_id,
                    "filename": filename,
                    "file_type": file_type,
                    "page_number": chunk.page_number,
                    "chunk_index": chunk.chunk_index,
                    "score": round(float(score), 4),
                    "snippet": snippet,
                    "full_content": chunk.content
                })

        # Sort by score descending
        ranked.sort(key=lambda x: x["score"], reverse=True)

        # Fallback: If user attached documents but no specific keywords matched above min_score,
        # return the leading document chunks so the LLM always receives document context.
        if not ranked and rows:
            for chunk, filename, file_type in rows[:top_k]:
                ranked.append({
                    "document_id": chunk.document_id,
                    "filename": filename,
                    "file_type": file_type,
                    "page_number": chunk.page_number,
                    "chunk_index": chunk.chunk_index,
                    "score": 0.5,
                    "snippet": chunk.content[:200] + ("..." if len(chunk.content) > 200 else ""),
                    "full_content": chunk.content
                })

        return ranked[:top_k]

    @staticmethod
    def format_rag_context(chunks: List[Dict[str, Any]]) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Builds the markdown context block to inject into the LLM system prompt
        and generates the citation list for UI display.
        """
        if not chunks:
            return "", []

        context_blocks = []
        citations = []

        for i, c in enumerate(chunks, 1):
            source_label = f"[Source {i}: {c['filename']} (Page {c['page_number']})]"
            context_blocks.append(f"{source_label}\n{c['full_content']}")
            citations.append({
                "document_id": c["document_id"],
                "filename": c["filename"],
                "file_type": c["file_type"],
                "page_number": c["page_number"],
                "chunk_index": c["chunk_index"],
                "score": c["score"],
                "snippet": c["snippet"]
            })

        rag_prompt = (
            "\n\n--- RELEVANT DOCUMENT CONTEXT (RAG) ---\n"
            "Use the following excerpts from the user's uploaded documents to answer their query accurately. "
            "When using facts from these documents, cite the source name and page number.\n\n"
            + "\n\n".join(context_blocks)
            + "\n--- END OF DOCUMENT CONTEXT ---\n"
        )

        return rag_prompt, citations

    @staticmethod
    def _generate_snippet(query: str, content: str, max_chars: int = 240) -> str:
        """Extracts a focused text snippet around keyword occurrences."""
        words = [w.lower() for w in query.split() if len(w) > 3]
        content_lower = content.lower()

        best_pos = -1
        for w in words:
            pos = content_lower.find(w)
            if pos != -1:
                best_pos = pos
                break

        if best_pos == -1 or best_pos < 50:
            snippet = content[:max_chars].strip()
            if len(content) > max_chars:
                snippet += "..."
            return snippet

        start = max(0, best_pos - 60)
        end = min(len(content), start + max_chars)
        snippet = ("..." if start > 0 else "") + content[start:end].strip() + ("..." if end < len(content) else "")
        return snippet
