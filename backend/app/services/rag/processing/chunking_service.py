class ChunkingService:
    # Caracteres qui marquent une fin de phrase quand ils terminent un mot.
    _SENTENCE_TERMINALS = (".", "!", "?", "…", ";\n")
    # Nombre maximal de mots a remonter pour chercher une fin de phrase.
    _BOUNDARY_SCAN_WINDOW = 15

    # Initialise le service avec la taille de chunk et le chevauchement souhaites.
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    # ------------------------------------------------------------------
    # API publique
    # ------------------------------------------------------------------

    # Decoupe un texte en chunks de taille fixe avec chevauchement.
    def chunk_text(self, text: str) -> list[str]:
        words = text.split()
        if not words:
            return []

        chunks: list[str] = []
        start = 0

        while start < len(words):
            ideal_end = min(start + self.chunk_size, len(words))

            # Coupe sur une fin de phrase pour eviter de casser une clause juridique.
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

            # Avance depuis la coupe reelle afin que l'overlap reste coherent.
            start = max(start + 1, end - self.chunk_overlap)

        return chunks

    # ------------------------------------------------------------------
    # Helpers prives
    # ------------------------------------------------------------------

    # Retourne une position proche de ideal_end apres une fin de phrase.
    @classmethod
    def _find_sentence_boundary(cls, words: list[str], ideal_end: int) -> int:
        """Retourne une position proche de ideal_end apres une fin de phrase.

        La recherche remonte dans une fenetre limitee. Si aucune ponctuation de
        fin n'est trouvee, la coupe ideale est conservee.
        """
        search_from = max(0, ideal_end - cls._BOUNDARY_SCAN_WINDOW)
        for i in range(ideal_end - 1, search_from - 1, -1):
            cleaned = words[i].rstrip("\"'»)’”")
            if any(cleaned.endswith(t) for t in cls._SENTENCE_TERMINALS):
                return i + 1
        return ideal_end
