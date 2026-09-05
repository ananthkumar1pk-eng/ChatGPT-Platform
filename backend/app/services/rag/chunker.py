"""
Text Chunking Engine with Overlap and Metadata Tracking.
"""

from typing import List, Dict, Any


class TextChunker:
    @staticmethod
    def chunk_document_pages(
        pages: List[Dict[str, Any]],
        chunk_size: int = 800,
        chunk_overlap: int = 150
    ) -> List[Dict[str, Any]]:
        """
        Splits pages into overlapping chunks while preserving page number and metadata.
        Returns a list of chunk dicts:
        {
            "chunk_index": int,
            "page_number": int,
            "content": str,
            "token_count": int,
            "meta_info": dict
        }
        """
        all_chunks = []
        global_chunk_idx = 0

        for page in pages:
            page_num = page.get("page_number", 1)
            page_text = page.get("text", "").strip()
            page_meta = page.get("meta", {})

            if not page_text:
                continue

            # Split text by paragraphs or double newlines first
            raw_chunks = TextChunker._recursive_split(
                text=page_text,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separators=["\n\n", "\n", ". ", "? ", "! ", " ", ""]
            )

            for chunk_text in raw_chunks:
                clean_chunk = chunk_text.strip()
                if clean_chunk:
                    token_count = max(1, len(clean_chunk.split()))
                    all_chunks.append({
                        "chunk_index": global_chunk_idx,
                        "page_number": page_num,
                        "content": clean_chunk,
                        "token_count": token_count,
                        "meta_info": page_meta
                    })
                    global_chunk_idx += 1

        return all_chunks

    @staticmethod
    def _recursive_split(
        text: str,
        chunk_size: int,
        chunk_overlap: int,
        separators: List[str]
    ) -> List[str]:
        """Splits text hierarchically using separators until chunks fit within chunk_size."""
        if len(text) <= chunk_size:
            return [text]

        separator = separators[-1]
        for s in separators:
            if s in text:
                separator = s
                break

        splits = text.split(separator) if separator else list(text)
        chunks = []
        current_chunk = ""

        for s in splits:
            item = s + separator if separator else s
            if len(current_chunk) + len(item) <= chunk_size:
                current_chunk += item
            else:
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())
                # Handle overlap
                if chunk_overlap > 0 and len(current_chunk) > chunk_overlap:
                    current_chunk = current_chunk[-chunk_overlap:] + item
                else:
                    current_chunk = item

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks
