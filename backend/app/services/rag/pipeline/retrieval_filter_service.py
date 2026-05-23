from __future__ import annotations

import re
from typing import Literal

from app.core.config import settings
from app.services.rag.processing.nlp_service import NLPService

# Numerical patterns that are high-risk for cross-article confusion in legal/financial text.
# Only these specific formats are checked — bare integers (e.g. "3") are too common to validate.
_NUMERIC_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\b\d+(?:[.,]\d+)?\s*%"),                          # percentages: 2%, 50%, 3,5%
    re.compile(r"\b\d+(?:[.,]\d+)?\s*(?:dinars?|DT|TND)\b", re.IGNORECASE),  # monetary: 500 DT
    re.compile(r"\bArticle\s+\d+(?:bis|ter|quater)?\b", re.IGNORECASE),       # article numbers
    re.compile(r"\bArt\.\s*\d+\b", re.IGNORECASE),                 # abbreviated articles
]

# Normalize "2 %" → "2%" so whitespace variants don't cause false positives.
_PERCENT_SPACE_RE = re.compile(r"(\d)\s+%")


def _normalize_numbers(text: str) -> str:
    return _PERCENT_SPACE_RE.sub(r"\1%", text)


class RetrievalFilterService:
    def __init__(self, nlp_service: NLPService):
        self.nlp_service = nlp_service

    def _filter_relevant_chunks(self, ranked_chunks: list[dict]) -> list[dict]:
        # .get() with fallback prevents KeyError on related chunks scored by
        # _score_chunks_by_vector, which does not set lexical_score.
        candidates = [
            chunk
            for chunk in ranked_chunks
            if chunk.get("vector_score", 0.0) >= settings.min_vector_score
            and chunk.get("lexical_score", 0.0) >= settings.min_lexical_score
            and chunk.get("final_score", 0.0) >= settings.min_final_score
        ]
        return self._apply_relative_threshold(candidates)

    def _filter_relevant_chunks_rrf(self, ranked_chunks: list[dict]) -> list[dict]:
        candidates = [
            chunk for chunk in ranked_chunks
            if chunk.get("rrf_score", 0.0) >= settings.min_rrf_score
            and chunk.get("final_score", 0.0) >= settings.min_rrf_final_score
        ]
        return self._apply_relative_threshold(candidates)

    @staticmethod
    def _apply_relative_threshold(chunks: list[dict]) -> list[dict]:
        """Drop chunks whose final_score is below 40% of the top chunk's score.

        Absolute thresholds (e.g. min_rrf_final_score=0.005) let in weakly
        relevant chunks when the best score is high.  The relative gate
        ensures that only chunks competitive with the top result are kept,
        regardless of the absolute score range of the scoring method used.
        """
        if not chunks:
            return []
        best = max(c.get("final_score", 0.0) for c in chunks)
        if best <= 0:
            return chunks
        cutoff = best * 0.40
        return [c for c in chunks if c.get("final_score", 0.0) >= cutoff]

    @staticmethod
    def _dedupe_chunks(chunks: list[dict]) -> list[dict]:
        deduped: list[dict] = []
        seen_keys: set[tuple[str, int]] = set()

        for chunk in chunks:
            key = (
                str(chunk.get("document_id", "")).strip(),
                int(chunk.get("chunk_index", -1)),
            )
            if key in seen_keys:
                continue
            seen_keys.add(key)
            deduped.append(chunk)

        return deduped

    @staticmethod
    def _filter_current_applicable_chunks(chunks: list[dict]) -> list[dict]:
        return [
            chunk
            for chunk in chunks
            if str(chunk.get("legal_status", "actif")).strip() == "actif"
        ]

    def _build_final_chunks(
        self,
        *,
        main_relevant_chunks: list[dict],
        related_relevant_chunks: list[dict],
        related_ranked_chunks: list[dict],
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"],
    ) -> list[dict]:
        if query_mode == "current" and question_profile not in {"historical", "comparative"}:
            current_main_chunks = self._filter_current_applicable_chunks(main_relevant_chunks)
            if current_main_chunks:
                return self._dedupe_chunks(current_main_chunks)[: settings.final_top_k]

        is_comparison_context = query_mode == "comparison" or question_profile in {
            "historical",
            "comparative",
        }
        if not is_comparison_context:
            return self._dedupe_chunks(main_relevant_chunks)[: settings.final_top_k]

        effective_related_chunks = related_relevant_chunks
        if (
            (query_mode == "comparison" or question_profile == "comparative")
            and not effective_related_chunks
            and related_ranked_chunks
        ):
            effective_related_chunks = related_ranked_chunks[:1]

        if not effective_related_chunks:
            return self._dedupe_chunks(main_relevant_chunks)[: settings.final_top_k]

        main_limit = max(2, settings.final_top_k - 2)
        related_limit = min(2, settings.final_top_k - 1)
        if query_mode == "comparison" or question_profile == "comparative":
            related_limit = max(1, related_limit)

        selected_main = main_relevant_chunks[:main_limit]
        selected_related = effective_related_chunks[:related_limit]
        merged_chunks = self._dedupe_chunks(selected_main + selected_related)

        if len(merged_chunks) < settings.final_top_k:
            remaining_chunks = self._dedupe_chunks(main_relevant_chunks + effective_related_chunks)
            existing_keys = {
                (str(chunk.get("document_id", "")).strip(), int(chunk.get("chunk_index", -1)))
                for chunk in merged_chunks
            }
            for chunk in remaining_chunks:
                key = (str(chunk.get("document_id", "")).strip(), int(chunk.get("chunk_index", -1)))
                if key in existing_keys:
                    continue
                merged_chunks.append(chunk)
                existing_keys.add(key)
                if len(merged_chunks) >= settings.final_top_k:
                    break

        merged_chunks.sort(key=lambda item: item["final_score"], reverse=True)
        return merged_chunks[: settings.final_top_k]

    @staticmethod
    def _has_unsupported_numbers(answer: str, final_chunks: list[dict]) -> bool:
        """Return True when a legally-sensitive number in the answer is absent from context.

        Only specific high-risk formats are checked (percentages, monetary amounts,
        article numbers). Bare integers are deliberately excluded to avoid
        over-triggering on dates, list indices, etc.
        """
        context_raw = " ".join(chunk["text"] for chunk in final_chunks)
        normalized_context = _normalize_numbers(context_raw)
        normalized_answer = _normalize_numbers(answer)

        for pattern in _NUMERIC_PATTERNS:
            for match in pattern.finditer(normalized_answer):
                value = match.group(0).strip()
                if not re.search(re.escape(value), normalized_context, re.IGNORECASE):
                    return True
        return False

    def _needs_fallback(self, answer: str, final_chunks: list[dict]) -> bool:
        cleaned_answer = answer.strip()
        if not cleaned_answer:
            return True

        lowered_answer = cleaned_answer.lower()
        if lowered_answer == "information non trouvee dans les sources fournies.":
            return False

        best_reranker_score = max(chunk.get("reranker_score", 0.0) for chunk in final_chunks)
        best_vector_score = max(chunk.get("vector_score", 0.0) for chunk in final_chunks)

        # Gate 1: BOTH confidence signals must be weak before triggering fallback.
        # Previously this was OR, which meant min_reranker_score=0.0 always
        # short-circuited to False and the guard never activated.
        if (
            best_reranker_score >= settings.min_reranker_score
            and best_vector_score >= settings.fallback_min_vector_score
        ):
            # High confidence from both signals — still check numerical grounding.
            return self._has_unsupported_numbers(cleaned_answer, final_chunks)

        if (
            best_reranker_score < settings.min_reranker_score
            and best_vector_score < settings.fallback_min_vector_score
        ):
            # Both signals are weak — unconditional fallback.
            return True

        # Mixed signals: one score is acceptable, the other is not.
        # Apply the token-overlap check + numerical grounding together.
        if self._has_unsupported_numbers(cleaned_answer, final_chunks):
            return True

        # Short answers from a weak-but-mixed context are acceptable.
        if len(cleaned_answer) <= settings.fallback_max_answer_length:
            return False

        context_text = " ".join(chunk["text"] for chunk in final_chunks).lower()
        answer_tokens = [
            token
            for token in self.nlp_service.provider.tokenize_words(lowered_answer)
            if len(token) > 5
        ]
        unsupported_tokens = [token for token in answer_tokens if token not in context_text]
        return len(unsupported_tokens) > settings.fallback_max_unsupported_tokens
