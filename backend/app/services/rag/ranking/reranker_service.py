import logging

from sentence_transformers import CrossEncoder


class RerankerService:
    MODEL_NAME = "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1"

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.model = CrossEncoder(self.MODEL_NAME)
        self.logger.info("RerankerService loaded model: %s", self.MODEL_NAME)

    def rerank(self, question: str, chunks: list[dict], top_k: int) -> list[dict]:
        if not chunks:
            return []

        pairs = [(question, chunk["text"]) for chunk in chunks]
        scores = self.model.predict(pairs)

        for chunk, score in zip(chunks, scores):
            chunk["reranker_score"] = float(score)

        reranked = sorted(chunks, key=lambda c: c["reranker_score"], reverse=True)
        return reranked[:top_k]
