"""Tests for RetrievalService._rrf_rerank — verifies that the legal modifier
scale keeps the RRF content signal dominant over legal-status bonuses.

Run:  cd backend && python -m pytest tests/test_retrieval_service_rrf.py -v
"""
from unittest.mock import MagicMock

import pytest
from app.core.config import settings
from app.services.rag.pipeline.retrieval_service import RetrievalService
from app.services.rag.ranking.legal_ranking_service import LegalRankingService

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_service() -> RetrievalService:
    svc = RetrievalService(
        qdrant_repository=MagicMock(),
        document_repository=MagicMock(),
        nlp_service=MagicMock(),
        embedding_service=MagicMock(),
        bm25_service=MagicMock,
        legal_ranking_service=LegalRankingService(),
    )
    return svc


def _make_chunk(document_id: str, chunk_index: int, legal_status: str = "actif") -> dict:
    return {
        "document_id": document_id,
        "chunk_index": chunk_index,
        "legal_status": legal_status,
        "score": 0.0,
        "text": "extrait juridique",
        "date_entree_vigueur": None,
        "date_publication": None,
        "realized_at": None,
    }


def _rrf_score(dense_rank: int, bm25_rank: int, k: int = 60) -> float:
    return 1 / (k + dense_rank) + 1 / (k + bm25_rank)


# ---------------------------------------------------------------------------
# RRF legal modifier scale
# ---------------------------------------------------------------------------

class TestRrfLegalModifierScale:
    """After applying rrf_legal_modifier_scale, the legal modifier must be
    in the same order of magnitude as RRF scores so content rank drives
    the final ordering instead of legal status alone.
    """

    def test_scaled_modifier_smaller_than_rrf_score(self):
        # Raw legal modifier for 'actif' in current mode = +0.12
        # RRF score for rank-1 in both lists ≈ 0.033
        # After scale=0.12: modifier = 0.12 * 0.12 = 0.0144
        # 0.0144 < 0.033 → modifier is smaller than max RRF signal
        raw_modifier = 0.12  # actif bonus, current mode
        scaled = raw_modifier * settings.rrf_legal_modifier_scale
        rrf_best = _rrf_score(1, 1)
        assert scaled < rrf_best, (
            f"Scaled modifier ({scaled:.4f}) should be less than max RRF score "
            f"({rrf_best:.4f}) to keep content rank dominant"
        )

    def test_rrf_rank_1_beats_rank_20_despite_actif_bonus(self):
        """A chunk that ranks 1st in both dense and BM25 must beat a chunk
        that ranks 20th in both, even when the loser has the same actif bonus.
        Without the scale fix this was not guaranteed because the bonus was
        larger than the RRF range.
        """
        svc = _make_service()
        doc_a = _make_chunk("doc_a", 0, "actif")
        doc_b = _make_chunk("doc_b", 0, "actif")

        enriched_map = {("doc_a", 0): doc_a, ("doc_b", 0): doc_b}
        dense_ranks = {("doc_a", 0): 1, ("doc_b", 0): 20}
        bm25_ranks = {("doc_a", 0): 1, ("doc_b", 0): 20}

        ranked = svc._rrf_rerank(
            enriched_map=enriched_map,
            dense_ranks=dense_ranks,
            bm25_ranks=bm25_ranks,
            question_profile="current",
            query_mode="current",
        )

        doc_a_result = next(c for c in ranked if c["document_id"] == "doc_a")
        doc_b_result = next(c for c in ranked if c["document_id"] == "doc_b")
        assert doc_a_result["final_score"] > doc_b_result["final_score"], (
            "Rank-1 chunk must outscore rank-20 chunk when both have the same legal status"
        )

    def test_futur_chunk_does_not_jump_above_actif_rank1(self):
        """A 'futur' document must not outscore an 'actif' rank-1 document
        in 'current' mode, even if futur has a higher raw RRF position.
        """
        svc = _make_service()
        actif_chunk = _make_chunk("doc_actif", 0, "actif")
        futur_chunk = _make_chunk("doc_futur", 0, "futur")

        enriched_map = {("doc_actif", 0): actif_chunk, ("doc_futur", 0): futur_chunk}
        # futur ranks 1st in both (better content match), actif ranks 5th
        dense_ranks = {("doc_futur", 0): 1, ("doc_actif", 0): 5}
        bm25_ranks = {("doc_futur", 0): 1, ("doc_actif", 0): 5}

        ranked = svc._rrf_rerank(
            enriched_map=enriched_map,
            dense_ranks=dense_ranks,
            bm25_ranks=bm25_ranks,
            question_profile="current",
            query_mode="current",
        )

        # futur penalty is -0.30 * 0.12 = -0.036; actif bonus = +0.12 * 0.12 = +0.014
        # futur RRF ≈ 0.033, actif RRF ≈ 0.025
        # futur final ≈ 0.033 - 0.036 = -0.003
        # actif final ≈ 0.025 + 0.014 = 0.039 → actif wins
        actif_result = next(c for c in ranked if c["document_id"] == "doc_actif")
        futur_result = next(c for c in ranked if c["document_id"] == "doc_futur")
        assert actif_result["final_score"] > futur_result["final_score"]

    def test_final_score_contains_scaled_modifier(self):
        """final_score must equal rrf_score + legal_modifier * scale (not raw modifier)."""
        svc = _make_service()
        chunk = _make_chunk("doc1", 0, "actif")
        enriched_map = {("doc1", 0): chunk}
        dense_ranks = {("doc1", 0): 1}
        bm25_ranks = {("doc1", 0): 1}

        ranked = svc._rrf_rerank(
            enriched_map=enriched_map,
            dense_ranks=dense_ranks,
            bm25_ranks=bm25_ranks,
            question_profile="current",
            query_mode="current",
        )
        result = ranked[0]
        expected_rrf = _rrf_score(1, 1)
        raw_modifier = result["legal_modifier"]
        expected_final = expected_rrf + raw_modifier * settings.rrf_legal_modifier_scale

        assert abs(result["final_score"] - expected_final) < 1e-9, (
            f"final_score={result['final_score']:.6f} != rrf+modifier*scale={expected_final:.6f}"
        )

    def test_rrf_legal_modifier_scale_in_config(self):
        assert 0 < settings.rrf_legal_modifier_scale <= 0.5, (
            "rrf_legal_modifier_scale must be a small positive fraction"
        )


# ---------------------------------------------------------------------------
# Qdrant fallback logging
# ---------------------------------------------------------------------------

class TestQdrantFallbackLogging:
    """The Qdrant datetime filter fallback must emit a WARNING, not silently
    swallow the exception as a non-event.
    """

    def test_search_fallback_emits_warning(self):
        import logging
        from unittest.mock import MagicMock, patch

        from app.repositories.qdrant_repository import QdrantRepository

        repo = QdrantRepository.__new__(QdrantRepository)
        repo.logger = logging.getLogger("test_qdrant_fallback")

        mock_client = MagicMock()
        repo.client = mock_client

        # First call (with date filter) raises; second call (fallback) succeeds.
        fake_response = MagicMock()
        fake_response.points = []
        mock_client.query_points.side_effect = [
            Exception("DatetimeRange index missing"),
            fake_response,
        ]

        # collection_exists must return True so we reach the search logic.
        with patch.object(repo, "collection_exists", return_value=True):
            with patch.object(repo, "_matches_query_mode", return_value=True):
                with patch.object(repo, "_point_to_chunk", return_value={}):
                    with patch.object(repo.logger, "warning") as mock_warn:
                        repo.search(
                            category="test_cat",
                            query_vector=[0.1] * 4,
                            limit=5,
                            query_mode="current",
                        )
                        mock_warn.assert_called_once()
                        call_msg = mock_warn.call_args[0][0]
                        assert "FAILED" in call_msg or "datetime" in call_msg.lower()

    def test_search_fallback_not_triggered_for_non_current_mode(self):
        """In future_preview or comparison mode the exception must propagate,
        not be swallowed by the fallback.
        """
        from unittest.mock import MagicMock, patch

        from app.repositories.qdrant_repository import QdrantRepository

        repo = QdrantRepository.__new__(QdrantRepository)
        import logging
        repo.logger = logging.getLogger("test_qdrant_propagate")
        mock_client = MagicMock()
        repo.client = mock_client
        mock_client.query_points.side_effect = Exception("some error")

        with patch.object(repo, "collection_exists", return_value=True):
            with pytest.raises(Exception, match="some error"):
                repo.search(
                    category="test_cat",
                    query_vector=[0.1] * 4,
                    limit=5,
                    query_mode="future_preview",
                )
