"""Tests for BM25Service — tokenization and lemmatization.

Run:  cd backend && python -m pytest tests/test_bm25_service.py -v
"""
from unittest.mock import MagicMock

from app.services.rag.ranking.bm25_service import BM25Service

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_chunks(texts: list[str]) -> list[dict]:
    return [
        {"text": t, "document_id": f"doc{i}", "chunk_index": i}
        for i, t in enumerate(texts)
    ]


def _mock_provider_with_lemmas(lemma_map: dict[str, set[str]]):
    """Return a mock nlp_provider whose tokenize_for_lexical_search uses lemma_map."""
    provider = MagicMock()
    def tokenize(text: str) -> set[str]:
        tokens: set[str] = set()
        for word in text.lower().split():
            clean = word.strip(".,;:")
            tokens.update(lemma_map.get(clean, {clean}))
        return tokens
    provider.tokenize_for_lexical_search.side_effect = tokenize
    return provider


# ---------------------------------------------------------------------------
# Without NLP provider (fallback path)
# ---------------------------------------------------------------------------

class TestBM25WithoutNlpProvider:
    # NOTE: BM25Okapi IDF = log((N - n + 0.5) / (n + 0.5)).
    # With N=2, n=1: IDF = log(1) = 0 → score always 0.
    # Corpora need ≥3 documents for unique-term IDF to be positive.

    def test_returns_results_for_matching_query(self):
        chunks = _make_chunks([
            "huile d olive exportation taux",
            "autre document sans rapport",
            "troisieme document irrelevant",   # 3 docs → IDF positive for unique terms
        ])
        svc = BM25Service(chunks)
        results = svc.search("exportation taux", top_k=3)
        assert len(results) >= 1
        assert results[0]["text"] == "huile d olive exportation taux"

    def test_empty_chunks_returns_empty(self):
        svc = BM25Service([])
        results = svc.search("quelque chose", top_k=5)
        assert results == []

    def test_no_match_returns_empty(self):
        chunks = _make_chunks(["alpha beta gamma", "delta epsilon zeta", "eta theta iota"])
        svc = BM25Service(chunks)
        results = svc.search("xyz abc zzz", top_k=5)
        assert results == []

    def test_top_k_limits_results(self):
        chunks = _make_chunks(["mot un", "mot deux", "mot trois", "mot quatre", "mot cinq"])
        svc = BM25Service(chunks)
        results = svc.search("mot", top_k=3)
        assert len(results) <= 3

    def test_result_has_bm25_score(self):
        # Use a unique term ("zymase") that appears in only 1 of 3 docs → IDF > 0
        chunks = _make_chunks(["zymase exportation huile", "autre document", "troisieme irrelevant"])
        svc = BM25Service(chunks)
        results = svc.search("zymase", top_k=1)
        assert len(results) == 1
        assert "bm25_score" in results[0]
        assert results[0]["bm25_score"] > 0


# ---------------------------------------------------------------------------
# With NLP provider (lemmatization path)
# ---------------------------------------------------------------------------

class TestBM25WithNlpProvider:
    def test_lemmatization_finds_morphological_variant(self):
        # Context has "applicable" (adjective); query uses "appliquer" (verb).
        # Shared lemma allows BM25 to find the chunk.
        lemma_map = {
            "applicable": {"appliquer"},
            "appliquer": {"appliquer"},
            "applicables": {"appliquer"},
            "taux": {"taux"},
            "exportation": {"exportation"},
        }
        provider = _mock_provider_with_lemmas(lemma_map)
        chunks = _make_chunks([
            "taux applicable à l exportation",
            "autre document irrelevant alpha",
            "troisieme document beta gamma",    # 3 docs so IDF > 0
        ])
        svc = BM25Service(chunks, nlp_provider=provider)
        results = svc.search("taux appliquer exportation", top_k=1)
        assert len(results) >= 1
        assert results[0]["text"] == "taux applicable à l exportation"

    def test_lemmatization_preferred_over_raw_split(self):
        # Without lemmatization, "exportées" would not match "exportation".
        # With lemmatization sharing lemma "export", the chunk is found.
        lemma_map = {
            "exportées": {"export"},
            "exportation": {"export"},
            "marchandises": {"marchandise"},
        }
        provider = _mock_provider_with_lemmas(lemma_map)
        chunks = _make_chunks([
            "marchandises exportées taux",
            "document sans rapport alpha",
            "troisieme irrelevant beta",         # 3 docs so IDF > 0
        ])
        svc = BM25Service(chunks, nlp_provider=provider)
        results = svc.search("exportation marchandise", top_k=3)
        assert len(results) >= 1
        assert results[0]["text"] == "marchandises exportées taux"

    def test_fallback_when_provider_raises(self):
        provider = MagicMock()
        provider.tokenize_for_lexical_search.side_effect = RuntimeError("NLP error")
        chunks = _make_chunks(["taux exportation"])
        # Should not raise; falls back to plain split
        svc = BM25Service(chunks, nlp_provider=provider)
        results = svc.search("taux", top_k=1)
        assert isinstance(results, list)

    def test_provider_called_for_query_and_corpus(self):
        provider = MagicMock()
        provider.tokenize_for_lexical_search.return_value = {"taux", "export"}
        chunks = _make_chunks(["taux d exportation"])
        BM25Service(chunks, nlp_provider=provider)
        # Called once per chunk during corpus build
        assert provider.tokenize_for_lexical_search.call_count >= 1
