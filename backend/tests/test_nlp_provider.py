"""Tests for FrenchNlpProvider — article detection and structure recognition.

Run:  cd backend && python -m pytest tests/test_nlp_provider.py -v
"""
import pytest
from app.infrastructure.nlp.nlp_provider import FrenchNlpProvider, _ARTICLE_RE


# ---------------------------------------------------------------------------
# Regex unit tests (no spaCy needed)
# ---------------------------------------------------------------------------

SHOULD_MATCH = [
    "Article 5",
    "Article 5-",
    "Article 5 -",
    "Article 5 :",
    "Article 5bis",
    "Article 5ter",
    "Article 5quater",
    "Article 5quinquies",
    "Article 1er",
    "Article Premier",
    "Art. 5",
    "Art 5",
    "ART. 5",
    "ARTICLE 5",
    "article 5",
    "Article 12 –",
    "Article 12.",
    "Article 100",
]

SHOULD_NOT_MATCH = [
    "paragraph 5",
    "Section 3",
    "Chapitre II",
    "5% de taux",
    "article",       # no number
    "Art",           # no number
]


@pytest.mark.parametrize("text", SHOULD_MATCH)
def test_regex_matches_expected_formats(text: str):
    assert _ARTICLE_RE.search(text) is not None, f"Expected match for: {text!r}"


@pytest.mark.parametrize("text", SHOULD_NOT_MATCH)
def test_regex_does_not_match_non_articles(text: str):
    assert _ARTICLE_RE.search(text) is None, f"Unexpected match for: {text!r}"


# ---------------------------------------------------------------------------
# FrenchNlpProvider integration tests (requires spaCy fr_core_news_md)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def provider():
    return FrenchNlpProvider()


class TestDetectArticles:
    def test_detects_standard_articles(self, provider):
        text = (
            "Article 1 - Objet de la loi\nLe présent article définit.\n\n"
            "Article 2 - Champ d application\nCet article régit.\n"
        )
        articles = provider.detect_articles(text)
        assert len(articles) == 2
        assert "Article 1" in articles[0]["article_title"]
        assert "Article 2" in articles[1]["article_title"]

    def test_detects_bis_ter_variants(self, provider):
        text = (
            "Article 3bis - Disposition particulière\nContenu 3bis.\n\n"
            "Article 3ter - Autre disposition\nContenu 3ter.\n"
        )
        articles = provider.detect_articles(text)
        assert len(articles) == 2
        assert "3bis" in articles[0]["article_title"].lower() or "3bis" in articles[0]["content"]

    def test_detects_abbreviated_art(self, provider):
        text = "Art. 7 - Taxe\nLe taux est de 2%.\n\nArt. 8 - Exonération\nExonéré.\n"
        articles = provider.detect_articles(text)
        assert len(articles) == 2

    def test_detects_uppercase_article(self, provider):
        text = "ARTICLE 10 - Budget\nLes crédits sont fixés.\n\nARTICLE 11 - Dépenses\nLes dépenses.\n"
        articles = provider.detect_articles(text)
        assert len(articles) == 2

    def test_detects_article_premier(self, provider):
        text = "Article Premier - Dispositions générales\nCet article.\n\nArticle 2 - Champ\nSuite.\n"
        articles = provider.detect_articles(text)
        assert len(articles) == 2
        assert "Premier" in articles[0]["article_title"] or "premier" in articles[0]["article_title"].lower()

    def test_empty_text_returns_empty(self, provider):
        assert provider.detect_articles("") == []

    def test_no_articles_returns_empty(self, provider):
        text = "Ce document ne contient aucun article structuré. Paragraphe général."
        assert provider.detect_articles(text) == []

    def test_article_content_is_isolated(self, provider):
        text = (
            "Article 5 - Crédits de paiement\n"
            "Les crédits sont fixés à cinq milliards de dinars.\n\n"
            "Article 6 - Recettes fiscales\n"
            "Les recettes fiscales sont réparties à 50%.\n"
        )
        articles = provider.detect_articles(text)
        assert len(articles) == 2
        # Article 5 content must NOT contain Article 6 content
        assert "50%" not in articles[0]["content"]
        # Article 6 content must NOT contain Article 5 content
        assert "cinq milliards" not in articles[1]["content"]


class TestExtractArticleHeader:
    def test_extracts_header_from_first_line(self, provider):
        chunk = "Article 5 - Crédits de paiement\nContenu de l article 5."
        header = provider.extract_article_header(chunk)
        assert "Article 5" in header

    def test_truncates_to_100_chars(self, provider):
        long_title = "Article 5 - " + "a" * 200
        header = provider.extract_article_header(long_title)
        assert len(header) <= 100

    def test_returns_empty_for_non_article_line(self, provider):
        chunk = "Ce texte ne commence pas par un article.\nSuite du texte."
        assert provider.extract_article_header(chunk) == ""

    def test_works_with_abbreviated_format(self, provider):
        chunk = "Art. 12 - Répartition\nLes ressources sont réparties."
        header = provider.extract_article_header(chunk)
        assert "12" in header


# Article number/title extraction is the responsibility of QdrantRepository._extract_article_fields().
# Coverage lives in test_qdrant_repository.py::TestExtractArticleFields.


class TestDetectDocumentStructure:
    def test_article_structured_document(self, provider):
        text = "Article 1 - Intro.\n\nArticle 2 - Contenu.\n\nArticle 3 - Fin.\n"
        assert provider.detect_document_structure(text) == "article_structured"

    def test_unstructured_document(self, provider):
        text = "Ce document est un paragraphe libre sans articles numérotés."
        assert provider.detect_document_structure(text) == "unstructured"

    def test_single_article_is_unstructured(self, provider):
        # 1 article match is not enough to call it structured
        text = "Article 1 - Unique article. Contenu."
        assert provider.detect_document_structure(text) == "unstructured"

    def test_uppercase_articles_detected(self, provider):
        text = "ARTICLE 1 - Premier.\n\nARTICLE 2 - Second.\n"
        assert provider.detect_document_structure(text) == "article_structured"
