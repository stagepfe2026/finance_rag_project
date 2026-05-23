"""Tests for ChunkingService — sentence-boundary-aware word chunking.

Run:  cd backend && python -m pytest tests/test_chunking_service.py -v
"""
import pytest

from app.services.rag.processing.chunking_service import ChunkingService


# ---------------------------------------------------------------------------
# _find_sentence_boundary (internal, tested via class method)
# ---------------------------------------------------------------------------

class TestFindSentenceBoundary:
    def test_finds_period_at_exact_position(self):
        words = ["Le", "taux", "est", "de", "2%.", "Les", "crédits"]
        # ideal_end=5 — word at index 4 ends with "." → boundary at 5
        result = ChunkingService._find_sentence_boundary(words, 5)
        assert result == 5

    def test_scans_back_within_window(self):
        words = ["Un", "article.", "Des", "dispositions", "relatives", "aux", "taxes"]
        # ideal_end=7, no terminal after index 1 — but "article." at index 1 is within window
        result = ChunkingService._find_sentence_boundary(words, 7)
        assert result == 2

    def test_falls_back_to_ideal_end_when_no_boundary(self):
        words = ["mot", "mot", "mot", "mot", "mot", "mot", "mot"]
        result = ChunkingService._find_sentence_boundary(words, 5)
        assert result == 5

    def test_question_mark_is_boundary(self):
        words = ["Est-ce", "applicable?", "Oui", "selon", "l article"]
        result = ChunkingService._find_sentence_boundary(words, 5)
        assert result == 2

    def test_exclamation_mark_is_boundary(self):
        words = ["Attention!", "Ce", "texte", "est", "important"]
        result = ChunkingService._find_sentence_boundary(words, 5)
        assert result == 1

    def test_trailing_quotes_are_stripped(self):
        # Word with trailing quote: "applicable."  → stripped → ends with "."
        words = ["Le", "taux", "est", "applicable.\"", "Les", "crédits"]
        result = ChunkingService._find_sentence_boundary(words, 6)
        assert result == 4

    def test_ellipsis_is_boundary(self):
        words = ["Pour", "mémoire…", "voir", "article", "5"]
        result = ChunkingService._find_sentence_boundary(words, 5)
        assert result == 2


# ---------------------------------------------------------------------------
# chunk_text — integration
# ---------------------------------------------------------------------------

class TestChunkText:
    def test_empty_text_returns_empty_list(self):
        svc = ChunkingService(chunk_size=10, chunk_overlap=2)
        assert svc.chunk_text("") == []

    def test_short_text_single_chunk(self):
        svc = ChunkingService(chunk_size=50, chunk_overlap=5)
        text = "Article 1. Disposition générale."
        chunks = svc.chunk_text(text)
        assert len(chunks) == 1
        assert chunks[0] == text

    def test_chunks_respect_size(self):
        svc = ChunkingService(chunk_size=10, chunk_overlap=2)
        words = ["mot"] * 30
        text = " ".join(words)
        chunks = svc.chunk_text(text)
        for chunk in chunks:
            assert len(chunk.split()) <= 10 + ChunkingService._BOUNDARY_SCAN_WINDOW

    def test_overlap_creates_shared_words(self):
        svc = ChunkingService(chunk_size=6, chunk_overlap=2)
        # 12 words total → should produce 3 chunks with overlap
        words = [f"w{i}." for i in range(12)]
        text = " ".join(words)
        chunks = svc.chunk_text(text)
        assert len(chunks) >= 2
        # The last words of chunk N should appear at the start of chunk N+1
        if len(chunks) >= 2:
            end_words = set(chunks[0].split()[-2:])
            start_words = set(chunks[1].split()[:4])
            assert end_words & start_words, "Expected overlap between consecutive chunks"

    def test_sentence_boundary_avoids_mid_sentence_cut(self):
        svc = ChunkingService(chunk_size=6, chunk_overlap=1)
        # Place a sentence boundary well before the ideal cut point
        text = "Un deux trois. Quatre cinq six sept huit neuf dix."
        chunks = svc.chunk_text(text)
        # First chunk should end at the sentence boundary "trois."
        assert chunks[0].endswith("trois.")

    def test_all_words_are_covered(self):
        svc = ChunkingService(chunk_size=8, chunk_overlap=2)
        words = [f"mot{i}" for i in range(25)]
        text = " ".join(words)
        chunks = svc.chunk_text(text)
        # Every word from the original text must appear in at least one chunk.
        all_chunk_words = set(w for c in chunks for w in c.split())
        assert set(words).issubset(all_chunk_words)

    def test_whitespace_only_returns_empty(self):
        svc = ChunkingService(chunk_size=10, chunk_overlap=2)
        assert svc.chunk_text("   \n\t  ") == []
