from __future__ import annotations

from rank_bm25 import BM25Okapi


class BM25Service:
    def __init__(self, chunks: list[dict], nlp_provider=None):
        self.chunks = chunks
        # nlp_provider est FrenchNlpProvider; typage souple pour eviter un import circulaire.
        self._nlp_provider = nlp_provider
        corpus = [self._tokenize(chunk["text"]) for chunk in chunks]
        self.bm25 = BM25Okapi(corpus) if corpus else None

    def _tokenize(self, text: str) -> list[str]:
        """Tokenise avec lemmatisation spaCy si disponible, sinon split simple.

        Les lemmes ameliorent le rappel sur les variantes morphologiques
        francaises. Le fallback garantit le fonctionnement sans provider NLP.
        """
        if self._nlp_provider is not None:
            try:
                return list(self._nlp_provider.tokenize_for_lexical_search(text))
            except Exception:
                pass
        return text.lower().split()

    def search(self, question: str, top_k: int) -> list[dict]:
        if self.bm25 is None or not self.chunks:
            return []

        query_tokens = self._tokenize(question)
        scores = self.bm25.get_scores(query_tokens)

        top_indices = sorted(
            range(len(scores)),
            key=lambda i: scores[i],
            reverse=True,
        )[:top_k]

        return [
            {**self.chunks[i], "bm25_score": float(scores[i])}
            for i in top_indices
            if scores[i] > 0
        ]
