# app/services/chunking_service.py
class ChunkingService:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str) -> list[str]:
        words = text.split()
        if not words:
            return []

        chunks = []
        start = 0

        while start < len(words):
            end = start + self.chunk_size
            chunk = " ".join(words[start:end])
            chunks.append(chunk)

            if end >= len(words):
                break

            start = end - self.chunk_overlap

        return chunks
