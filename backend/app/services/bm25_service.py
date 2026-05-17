from rank_bm25 import BM25Okapi


class BM25Service:
    def __init__(self, chunks: list[dict]):
        self.chunks = chunks
        corpus = [self._tokenize(chunk["text"]) for chunk in chunks]
        self.bm25 = BM25Okapi(corpus) if corpus else None

    @staticmethod
    def _tokenize(text: str) -> list[str]:
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
