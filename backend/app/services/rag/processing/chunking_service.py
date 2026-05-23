class ChunkingService:
    # Characters that mark a sentence boundary when they appear at the end of a word token.
    _SENTENCE_TERMINALS = (".", "!", "?", "…", ";\n")
    # Maximum words to scan backwards when looking for a sentence boundary.
    _BOUNDARY_SCAN_WINDOW = 15

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def chunk_text(self, text: str) -> list[str]:
        words = text.split()
        if not words:
            return []

        chunks: list[str] = []
        start = 0
        step = max(1, self.chunk_size - self.chunk_overlap)

        while start < len(words):
            ideal_end = min(start + self.chunk_size, len(words))

            # Snap the cut point to a sentence boundary so we never split a
            # legal clause mid-sentence.  Only apply when not at the last word.
            end = (
                self._find_sentence_boundary(words, ideal_end)
                if ideal_end < len(words)
                else ideal_end
            )

            chunk = " ".join(words[start:end]).strip()
            if chunk:
                chunks.append(chunk)

            if end >= len(words):
                break

            # Advance by step relative to the *adjusted* end so overlap is
            # measured from the actual cut, not the ideal one.
            start = max(start + 1, end - self.chunk_overlap)

        return chunks

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @classmethod
    def _find_sentence_boundary(cls, words: list[str], ideal_end: int) -> int:
        """Return an index near ideal_end that falls after a sentence-final word.

        Scans backwards from ideal_end within a fixed window.  The word at
        position i is sentence-final if, after stripping trailing quotes and
        brackets, it ends with a terminal punctuation mark.  Returns ideal_end
        unchanged when no boundary is found in the window.
        """
        search_from = max(0, ideal_end - cls._BOUNDARY_SCAN_WINDOW)
        for i in range(ideal_end - 1, search_from - 1, -1):
            cleaned = words[i].rstrip("\"'»)”’")
            if any(cleaned.endswith(t) for t in cls._SENTENCE_TERMINALS):
                return i + 1
        return ideal_end
