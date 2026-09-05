"""
Unit tests for Document Parsing, Chunking, and Vector Retrieval.
"""

from app.services.rag.chunker import TextChunker
from app.services.rag.embeddings import EmbeddingService
from app.services.rag.vector_store import VectorStoreService


def test_chunker_basic():
    pages = [
        {"page_number": 1, "text": "This is a test paragraph for the document. " * 30, "meta": {}},
        {"page_number": 2, "text": "Second page content describing artificial intelligence systems and neural networks.", "meta": {}}
    ]
    chunks = TextChunker.chunk_document_pages(pages, chunk_size=300, chunk_overlap=50)
    assert len(chunks) >= 2
    assert chunks[0]["page_number"] == 1
    assert chunks[-1]["page_number"] == 2
    assert "token_count" in chunks[0]


def test_tfidf_similarity():
    query = "quantum computing algorithms"
    corpus = [
        "Quantum computing uses qubits to solve complex mathematical algorithms.",
        "A recipe for chocolate chip cookies and baking tips.",
        "Database indexing techniques for relational PostgreSQL tables."
    ]
    scores = EmbeddingService.compute_local_similarity(query, corpus)
    assert len(scores) == 3
    # Quantum text should have highest similarity
    assert scores[0] > scores[1]
    assert scores[0] > scores[2]


def test_snippet_generation():
    content = "Introduction section. Later in chapter three we discuss deep reinforcement learning in robotics applications and autonomous vehicles. Summary."
    query = "deep reinforcement learning"
    snippet = VectorStoreService._generate_snippet(query, content)
    assert "reinforcement" in snippet.lower()
