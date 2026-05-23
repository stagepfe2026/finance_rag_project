from __future__ import annotations

from rank_bm25 import BM25Okapi


class BM25Service:
    def __init__(self, chunks: list[dict], nlp_provider=None):
        self.chunks = chunks
        # nlp_provider is FrenchNlpProvider; kept as Any to avoid a circular import.
        self._nlp_provider = nlp_provider
        corpus = [self._tokenize(chunk["text"]) for chunk in chunks]
        self.bm25 = BM25Okapi(corpus) if corpus else None

    def _tokenize(self, text: str) -> list[str]:
        """Tokenize with spaCy lemmatization when available, else plain split.

        Using lemmatized forms (e.g. 'applicable' → 'appliquer') dramatically
        improves recall for French morphological variants.  The plain-split
        fallback guarantees correctness if the provider is unavailable.
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
