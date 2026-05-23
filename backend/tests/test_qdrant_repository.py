"""Tests for QdrantRepository static helpers — no Qdrant server required.

Run:  cd backend && python -m pytest tests/test_qdrant_repository.py -v
"""
import pytest

from app.repositories.qdrant_repository import QdrantRepository


# ---------------------------------------------------------------------------
# _stable_point_id
# ---------------------------------------------------------------------------

class TestStablePointId:
    def test_same_inputs_give_same_id(self):
        a = QdrantRepository._stable_point_id("doc_abc", 0)
        b = QdrantRepository._stable_point_id("doc_abc", 0)
        assert a == b

    def test_different_index_gives_different_id(self):
        a = QdrantRepository._stable_point_id("doc_abc", 0)
        b = QdrantRepository._stable_point_id("doc_abc", 1)
        assert a != b

    def test_different_document_gives_different_id(self):
        a = QdrantRepository._stable_point_id("doc_abc", 0)
        b = QdrantRepository._stable_point_id("doc_xyz", 0)
        assert a != b

    def test_result_is_positive_integer(self):
        result = QdrantRepository._stable_point_id("doc_test", 5)
        assert isinstance(result, int)
        assert result > 0

    def test_result_fits_in_63_bits(self):
        result = QdrantRepository._stable_point_id("doc_test", 0)
        assert result < 2**63

    def test_deterministic_across_calls(self):
        ids = {QdrantRepository._stable_point_id("doc_x", 3) for _ in range(10)}
        assert len(ids) == 1


# ---------------------------------------------------------------------------
# _extract_article_fields
# ---------------------------------------------------------------------------

class TestExtractArticleFields:
    def test_standard_article_with_title(self):
        chunk = "Article 5 - Crédits de paiement\nLe budget est fixé."
        num, title = QdrantRepository._extract_article_fields(chunk)
        assert num == "5"
        assert title == "Crédits de paiement"

    def test_article_bis_variant(self):
        chunk = "Article 5bis - Disposition particulière\nContenu."
        num, title = QdrantRepository._extract_article_fields(chunk)
        assert num == "5bis"

    def test_article_premier(self):
        chunk = "Article Premier - Objet de la loi\nContenu."
        num, title = QdrantRepository._extract_article_fields(chunk)
        assert num == "Premier"

    def test_abbreviated_art_format(self):
        chunk = "Art. 12 - Répartition\nContenu."
        num, title = QdrantRepository._extract_article_fields(chunk)
        assert num == "12"

    def test_bracket_prefix_format(self):
        # Sub-chunk continuation format: "[Article 5 - Titre] suite du texte"
        chunk = "[Article 5 - Gestion budgétaire] suite du contenu de l article."
        num, title = QdrantRepository._extract_article_fields(chunk)
        assert num == "5"
        assert title == "Gestion budgétaire"

    def test_no_article_returns_none_none(self):
        chunk = "Ce texte ne contient aucun article numéroté. Paragraphe libre."
        num, title = QdrantRepository._extract_article_fields(chunk)
        assert num is None
        assert title is None

    def test_article_without_title_returns_none_title(self):
        chunk = "Article 5\nContenu immédiat sans titre de rubrique."
        num, title = QdrantRepository._extract_article_fields(chunk)
        assert num == "5"
        assert title is None or title == ""

    def test_title_truncated_at_120_chars(self):
        long_title = "a" * 200
        chunk = f"Article 5 - {long_title}\nContenu."
        _, title = QdrantRepository._extract_article_fields(chunk)
        assert title is not None
        assert len(title) <= 120

    def test_article_1er_variant(self):
        chunk = "Article 1er - Premier article\nContenu."
        num, _ = QdrantRepository._extract_article_fields(chunk)
        assert num == "1er"
