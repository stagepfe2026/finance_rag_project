# app/services/chunking_service.py
import re


class ChunkingService:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    # def chunk_text(self, text: str) -> list[str]:
    #     words = text.split()
    #     if not words:
    #         return []

    #     chunks = []
    #     start = 0

    #     while start < len(words):
    #         end = start + self.chunk_size
    #         chunk = " ".join(words[start:end])
    #         chunks.append(chunk)

    #         if end >= len(words):
    #             break

    #         start = end - self.chunk_overlap

    #     return chunks
    def chunk_by_article(self, text: str) -> list[str]:
        matches = list(re.finditer(r"Article\s+\d+\s*-?", text))
        if not matches:
            return [text.strip()] if text.strip() else []

        chunks = []
        for i, match in enumerate(matches):
            start = match.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

        return chunks
