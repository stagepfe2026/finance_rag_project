"""Tests for RetrievalFilterService — fallback guard and numerical validation.

Run:  cd backend && python -m pytest tests/test_retrieval_filter.py -v
"""
from unittest.mock import MagicMock

from app.core.rag_messages import MSG_OUT_OF_DOMAIN, MSG_UNRELIABLE
from app.services.rag.pipeline.retrieval_filter_service import RetrievalFilterService

# Alias for brevity in the numerical-grounding test class
_has_unsupported_numbers = RetrievalFilterService._has_unsupported_numbers


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_chunk(
    text: str = "contenu de test",
    vector_score: float = 0.8,
    reranker_score: float = 0.7,
    rrf_score: float = 0.02,
    final_score: float = 0.8,
    legal_status: str = "actif",
    document_id: str = "doc1",
    chunk_index: int = 0,
) -> dict:
    return {
        "text": text,
        "vector_score": vector_score,
        "reranker_score": reranker_score,
        "rrf_score": rrf_score,
        "final_score": final_score,
        "legal_status": legal_status,
        "document_id": document_id,
        "chunk_index": chunk_index,
    }


def _make_service() -> RetrievalFilterService:
    nlp_service = MagicMock()
    nlp_service.provider.tokenize_words.return_value = []
    return RetrievalFilterService(nlp_service=nlp_service)


# ---------------------------------------------------------------------------
# _has_unsupported_numbers (static method)
# ---------------------------------------------------------------------------

class TestHasUnsupportedNumbers:
    def test_percentage_present_in_context(self):
        chunks = [_make_chunk(text="Le taux applicable est de 2% pour l exportation.")]
        assert _has_unsupported_numbers("Le taux est 2%.", chunks) is False

    def test_percentage_absent_from_context(self):
        chunks = [_make_chunk(text="Le taux applicable est de 2% pour l exportation.")]
        assert _has_unsupported_numbers("Le taux est 50%.", chunks) is True

    def test_percentage_with_space_normalised(self):
        # Context has "2 %" (space), answer has "2%" (no space) — must NOT trigger
        chunks = [_make_chunk(text="taux de 2 % applicable")]
        assert _has_unsupported_numbers("Le taux est 2%.", chunks) is False

    def test_article_number_present_in_context(self):
        chunks = [_make_chunk(text="Article 5 fixe les crédits de paiement.")]
        assert _has_unsupported_numbers("Voir Article 5.", chunks) is False

    def test_article_number_absent_from_context(self):
        chunks = [_make_chunk(text="Article 5 fixe les crédits de paiement.")]
        # LLM invents Article 2 — not in context
        assert _has_unsupported_numbers("Voir Article 2.", chunks) is True

    def test_monetary_amount_present_in_context(self):
        chunks = [_make_chunk(text="Un montant de 500 DT est prévu.")]
        assert _has_unsupported_numbers("Le montant est 500 DT.", chunks) is False

    def test_monetary_amount_absent_from_context(self):
        chunks = [_make_chunk(text="Un montant de 500 DT est prévu.")]
        assert _has_unsupported_numbers("Le montant est 1000 DT.", chunks) is True

    def test_bare_integer_does_not_trigger(self):
        # "3" alone is too common to validate — should not trigger
        chunks = [_make_chunk(text="Il y a plusieurs catégories.")]
        assert _has_unsupported_numbers("Il y a 3 catégories.", chunks) is False

    def test_multiple_chunks_checked_together(self):
        chunks = [
            _make_chunk(text="taux de 2% pour l huile d olive", document_id="doc1", chunk_index=0),
            _make_chunk(text="taux de 4% pour l huile lampante", document_id="doc1", chunk_index=1),
        ]
        # Both percentages are present across the combined context
        assert _has_unsupported_numbers("Taux: 2% et 4%.", chunks) is False

    def test_empty_answer_no_numbers(self):
        chunks = [_make_chunk(text="contenu quelconque")]
        assert _has_unsupported_numbers("Réponse sans chiffres.", chunks) is False

    def test_article_plural_in_context_matches_singular_in_answer(self):
        # Context uses "articles 81, 82 et 85" (plural); answer uses "l'article 81" (singular).
        # The check must NOT trigger because the number 81 is supported.
        chunks = [_make_chunk(text="Conformément aux articles 81, 82 et 85 du CDPF.")]
        assert _has_unsupported_numbers("Selon l'article 81 du CDPF.", chunks) is False

    def test_article_singular_in_context_matches_singular_in_answer(self):
        chunks = [_make_chunk(text="Article 81 fixe les majorations de retard.")]
        assert _has_unsupported_numbers("Voir Article 81 du CDPF.", chunks) is False


# ---------------------------------------------------------------------------
# _needs_fallback — main logic
# ---------------------------------------------------------------------------

class TestNeedsFallback:
    def test_empty_answer_triggers_fallback(self):
        svc = _make_service()
        assert svc._needs_fallback("", [_make_chunk()]) is True

    def test_whitespace_only_triggers_fallback(self):
        svc = _make_service()
        assert svc._needs_fallback("   ", [_make_chunk()]) is True

    def test_canonical_unreliable_message_skips_fallback(self):
        svc = _make_service()
        chunks = [_make_chunk(reranker_score=0.0, vector_score=0.0)]
        assert svc._needs_fallback(MSG_UNRELIABLE, chunks) is False

    def test_canonical_out_of_domain_message_skips_fallback(self):
        svc = _make_service()
        chunks = [_make_chunk(reranker_score=0.0, vector_score=0.0)]
        assert svc._needs_fallback(MSG_OUT_OF_DOMAIN, chunks) is False

    def test_high_confidence_both_signals_no_fallback(self):
        # reranker >= 0.30 AND vector >= 0.58 → no fallback (unless number hallucination)
        svc = _make_service()
        chunks = [_make_chunk(
            text="Le taux de 2% est applicable à l exportation d huile d olive.",
            reranker_score=0.75,
            vector_score=0.80,
        )]
        answer = "Le taux est de 2%."
        assert svc._needs_fallback(answer, chunks) is False

    def test_high_confidence_but_hallucinated_percentage_triggers_fallback(self):
        # Both scores are high, but LLM cites 50% which is not in context
        svc = _make_service()
        chunks = [_make_chunk(
            text="Le taux de 2% est applicable à l exportation d huile d olive.",
            reranker_score=0.75,
            vector_score=0.80,
        )]
        answer = "Le taux est de 50%."
        assert svc._needs_fallback(answer, chunks) is True

    def test_both_signals_weak_short_grounded_answer_no_fallback(self):
        # Gate 2 (unconditional fallback when both signals weak) was removed.
        # A short grounded answer with no unsupported numbers must pass through
        # even when both reranker and vector scores are below their thresholds.
        svc = _make_service()
        chunks = [_make_chunk(reranker_score=0.10, vector_score=0.45)]
        answer = "Une réponse quelconque sans chiffres spéciaux."
        assert svc._needs_fallback(answer, chunks) is False

    def test_both_signals_weak_hallucinated_number_triggers_fallback(self):
        # Both signals weak, but the answer cites 75% which is absent from context.
        svc = _make_service()
        chunks = [_make_chunk(text="Le taux applicable est de 2%.", reranker_score=0.10, vector_score=0.45)]
        answer = "Le taux est de 75%."
        assert svc._needs_fallback(answer, chunks) is True

    def test_mixed_signals_short_answer_no_fallback(self):
        # reranker weak but vector ok; short answer → acceptable
        svc = _make_service()
        chunks = [_make_chunk(reranker_score=0.10, vector_score=0.65)]
        answer = "Réponse courte."  # length <= fallback_max_answer_length
        assert svc._needs_fallback(answer, chunks) is False

    def test_mixed_signals_hallucinated_article_triggers_fallback(self):
        svc = _make_service()
        chunks = [_make_chunk(
            text="Article 5 fixe les crédits de paiement des dépenses de l État.",
            reranker_score=0.10,
            vector_score=0.65,
        )]
        answer = "Voir Article 2 et Article 6 pour les crédits."
        assert svc._needs_fallback(answer, chunks) is True

    def test_both_signals_weak_long_answer_many_unsupported_tokens_triggers_fallback(self):
        # Both scores weak; answer is longer than fallback_max_answer_length (240 chars);
        # tokenize_words returns 70 unsupported tokens > threshold (60) → fallback.
        svc = _make_service()
        chunks = [_make_chunk(reranker_score=0.05, vector_score=0.45)]
        answer = "Une longue réponse inventée. " + "quelquechose " * 25  # ~354 chars > 240
        # tokenize_words returns tokens of length > 5 that are not in context text
        svc.nlp_service.provider.tokenize_words.return_value = ["inventée"] * 70
        assert svc._needs_fallback(answer, chunks) is True


# ---------------------------------------------------------------------------
# _filter_current_applicable_chunks
# ---------------------------------------------------------------------------

class TestFilterCurrentApplicableChunks:
    def test_keeps_only_actif(self):
        chunks = [
            _make_chunk(legal_status="actif", document_id="a", chunk_index=0),
            _make_chunk(legal_status="remplace", document_id="b", chunk_index=0),
            _make_chunk(legal_status="abroge", document_id="c", chunk_index=0),
            _make_chunk(legal_status="futur", document_id="d", chunk_index=0),
        ]
        result = RetrievalFilterService._filter_current_applicable_chunks(chunks)
        assert len(result) == 1
        assert result[0]["legal_status"] == "actif"

    def test_empty_input(self):
        assert RetrievalFilterService._filter_current_applicable_chunks([]) == []


# ---------------------------------------------------------------------------
# _dedupe_chunks
# ---------------------------------------------------------------------------

class TestDedupeChunks:
    def test_removes_duplicates_by_doc_id_and_index(self):
        chunks = [
            _make_chunk(document_id="doc1", chunk_index=0),
            _make_chunk(document_id="doc1", chunk_index=0),  # duplicate
            _make_chunk(document_id="doc1", chunk_index=1),
        ]
        result = RetrievalFilterService._dedupe_chunks(chunks)
        assert len(result) == 2

    def test_preserves_order(self):
        chunks = [
            _make_chunk(document_id="doc1", chunk_index=2),
            _make_chunk(document_id="doc1", chunk_index=0),
        ]
        result = RetrievalFilterService._dedupe_chunks(chunks)
        assert result[0]["chunk_index"] == 2
        assert result[1]["chunk_index"] == 0


# ---------------------------------------------------------------------------
# _apply_relative_threshold
# ---------------------------------------------------------------------------

class TestApplyRelativeThreshold:
    def test_drops_chunks_below_40_percent_of_best(self):
        chunks = [
            _make_chunk(final_score=1.0, document_id="a", chunk_index=0),
            _make_chunk(final_score=0.5, document_id="b", chunk_index=0),  # 50% — keep
            _make_chunk(final_score=0.39, document_id="c", chunk_index=0),  # 39% — drop
        ]
        result = RetrievalFilterService._apply_relative_threshold(chunks)
        assert len(result) == 2
        scores = [c["final_score"] for c in result]
        assert 1.0 in scores
        assert 0.5 in scores
        assert 0.39 not in scores

    def test_keeps_all_chunks_when_all_above_cutoff(self):
        chunks = [
            _make_chunk(final_score=1.0, document_id="a", chunk_index=0),
            _make_chunk(final_score=0.9, document_id="b", chunk_index=0),
            _make_chunk(final_score=0.8, document_id="c", chunk_index=0),
        ]
        result = RetrievalFilterService._apply_relative_threshold(chunks)
        assert len(result) == 3

    def test_empty_input_returns_empty(self):
        assert RetrievalFilterService._apply_relative_threshold([]) == []

    def test_best_score_zero_returns_all(self):
        # When best score is 0, cutoff logic is skipped and all chunks are returned.
        chunks = [
            _make_chunk(final_score=0.0, document_id="a", chunk_index=0),
            _make_chunk(final_score=0.0, document_id="b", chunk_index=0),
        ]
        result = RetrievalFilterService._apply_relative_threshold(chunks)
        assert len(result) == 2

    def test_exactly_at_cutoff_is_kept(self):
        # A chunk at exactly 40% of the best score must be included.
        chunks = [
            _make_chunk(final_score=1.0, document_id="a", chunk_index=0),
            _make_chunk(final_score=0.40, document_id="b", chunk_index=0),
        ]
        result = RetrievalFilterService._apply_relative_threshold(chunks)
        assert len(result) == 2


# ---------------------------------------------------------------------------
# _filter_relevant_chunks_vector — vector-only path (related documents)
# ---------------------------------------------------------------------------

class TestFilterRelevantChunksVector:
    """Related-document chunks are scored by _score_chunks_by_vector which
    never sets lexical_score or rrf_score.  The vector filter must pass
    qualifying chunks without requiring those absent fields.
    """

    def test_passes_chunk_with_good_vector_and_final_score(self):
        svc = _make_service()
        chunks = [_make_chunk(vector_score=0.75, final_score=0.87)]
        result = svc._filter_relevant_chunks_vector(chunks)
        assert len(result) == 1

    def test_rejects_chunk_below_min_vector_score(self):
        svc = _make_service()
        chunks = [_make_chunk(vector_score=0.40, final_score=0.52)]
        result = svc._filter_relevant_chunks_vector(chunks)
        assert result == []

    def test_rejects_chunk_below_min_final_score(self):
        svc = _make_service()
        chunks = [_make_chunk(vector_score=0.80, final_score=0.30)]
        result = svc._filter_relevant_chunks_vector(chunks)
        assert result == []

    def test_does_not_require_lexical_score_field(self):
        # Chunk has no lexical_score key at all — must not raise and must pass.
        svc = _make_service()
        chunk = {
            "text": "extrait",
            "vector_score": 0.75,
            "final_score": 0.87,
            "document_id": "doc1",
            "chunk_index": 0,
        }
        result = svc._filter_relevant_chunks_vector([chunk])
        assert len(result) == 1

    def test_does_not_require_rrf_score_field(self):
        svc = _make_service()
        chunk = {
            "text": "extrait",
            "vector_score": 0.75,
            "final_score": 0.87,
            "document_id": "doc1",
            "chunk_index": 0,
        }
        result = svc._filter_relevant_chunks_vector([chunk])
        assert len(result) == 1

    def test_applies_relative_threshold(self):
        svc = _make_service()
        chunks = [
            _make_chunk(vector_score=0.90, final_score=1.0, document_id="a", chunk_index=0),
            _make_chunk(vector_score=0.55, final_score=0.67, document_id="b", chunk_index=0),
            _make_chunk(vector_score=0.52, final_score=0.30, document_id="c", chunk_index=0),
        ]
        result = svc._filter_relevant_chunks_vector(chunks)
        # chunk c: final_score=0.30 < 40% of 1.0 → dropped
        assert all(c["final_score"] >= 0.40 for c in result)

    def test_empty_input_returns_empty(self):
        svc = _make_service()
        assert svc._filter_relevant_chunks_vector([]) == []

    def test_related_chunks_not_always_empty(self):
        """Regression: before the fix, related chunks always came back empty
        because _filter_relevant_chunks required lexical_score >= 0.12 which
        was never set on vector-only scored chunks (default 0.0 < 0.12).
        """
        svc = _make_service()
        related_chunks = [
            {
                "text": "extrait juridique lié",
                "vector_score": 0.72,
                "rrf_score": 0.0,       # not set in vector path
                "legal_modifier": 0.12,
                "final_score": 0.84,
                "legal_status": "actif",
                "document_id": "related_doc",
                "chunk_index": 0,
                # lexical_score intentionally absent — never set by _score_chunks_by_vector
            }
        ]
        result = svc._filter_relevant_chunks_vector(related_chunks)
        assert len(result) == 1, (
            "related_relevant_chunks must not be empty when vector_score and "
            "final_score are above thresholds"
        )
