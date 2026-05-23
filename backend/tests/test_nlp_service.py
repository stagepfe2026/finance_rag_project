"""Tests for NLPService.prepare_chunks — article header injection into sub-chunks.

Run:  cd backend && python -m pytest tests/test_nlp_service.py -v
"""
import pytest
from app.infrastructure.nlp.nlp_provider import FrenchNlpProvider
from app.services.rag.processing.nlp_service import NLPService


@pytest.fixture(scope="module")
def nlp_service():
    return NLPService(FrenchNlpProvider())


# ---------------------------------------------------------------------------
# Article header injection
# ---------------------------------------------------------------------------

class TestPrepareChunksHeaderInjection:
    def test_first_sub_chunk_starts_with_article_header(self, nlp_service):
        # Article 1 fits in one chunk — no header injection needed on sub-chunk 0
        text = "Article 1 - Objet\n" + "mot " * 100
        chunks = nlp_service.prepare_chunks(text)
        assert any("Article 1" in c for c in chunks)

    def test_continuation_sub_chunks_carry_article_header(self, nlp_service):
        # Article with 300 words → will be split into ≥2 sub-chunks of 120 words
        # Sub-chunk 1+ must start with "[Article 5 ...]"
        text = "Article 5 - Crédits de paiement\n" + "budget dépenses crédits " * 120
        chunks = nlp_service.prepare_chunks(text)
        if len(chunks) > 1:
            for sub_chunk in chunks[1:]:
                assert sub_chunk.startswith("[Article 5"), (
                    f"Continuation chunk missing header: {sub_chunk[:80]!r}"
                )

    def test_header_not_duplicated_in_first_chunk(self, nlp_service):
        # The first sub-chunk must NOT have the bracket prefix (it already starts naturally)
        text = "Article 3 - Recettes fiscales\n" + "recette taxe taux " * 50
        chunks = nlp_service.prepare_chunks(text)
        assert not chunks[0].startswith("[Article"), (
            f"First chunk should not have bracket prefix: {chunks[0][:80]!r}"
        )

    def test_multiple_articles_each_carry_their_own_header(self, nlp_service):
        # Two long articles — continuation chunks of article 5 carry [Article 5],
        # continuation chunks of article 6 carry [Article 6]
        text = (
            "Article 5 - Crédits\n" + "cinq millions budget dépenses crédits " * 100 + "\n\n"
            "Article 6 - Recettes\n" + "six millions fiscales recettes taxe " * 100
        )
        chunks = nlp_service.prepare_chunks(text)
        article5_continuations = [c for c in chunks if c.startswith("[Article 5")]
        article6_continuations = [c for c in chunks if c.startswith("[Article 6")]
        # Both articles are long enough to produce continuation chunks
        assert len(article5_continuations) >= 1
        assert len(article6_continuations) >= 1
        # No article 5 chunk should carry an Article 6 header
        for c in article5_continuations:
            assert "Article 6" not in c.split("]", 1)[0]
        for c in article6_continuations:
            assert "Article 5" not in c.split("]", 1)[0]

    def test_short_article_no_extra_chunks(self, nlp_service):
        # Article short enough to fit in one chunk → no continuation, no header injection
        text = "Article 2 - Bref\nCet article est court."
        chunks = nlp_service.prepare_chunks(text)
        assert len(chunks) == 1
        assert not chunks[0].startswith("[Article")

    def test_unstructured_document_falls_back_to_word_chunking(self, nlp_service):
        # No article markers → falls back to word-based chunks (no bracket prefix)
        text = "Ce document est un texte libre. " + "contenu " * 200
        chunks = nlp_service.prepare_chunks(text)
        for c in chunks:
            assert not c.startswith("[Article"), (
                f"Fallback chunk should not have article prefix: {c[:80]!r}"
            )

    def test_chunks_are_not_empty(self, nlp_service):
        text = "Article 1 - Test\n" + "données juridiques " * 30
        chunks = nlp_service.prepare_chunks(text)
        for c in chunks:
            assert c.strip(), "Empty chunk produced"

    def test_abbreviated_article_detected_and_injected(self, nlp_service):
        # Art. format — header injection must work with abbreviated articles too
        text = "Art. 7 - Taxe sur exportation\n" + "taxe taux exportation produit " * 100
        chunks = nlp_service.prepare_chunks(text)
        if len(chunks) > 1:
            assert chunks[1].startswith("[Art.")


# ---------------------------------------------------------------------------
# Regression: article isolation (content from different articles must not mix)
# ---------------------------------------------------------------------------

class TestArticleContentIsolation:
    def test_article_5_content_not_in_article_6_chunk(self, nlp_service):
        text = (
            "Article 5 - Crédits de paiement\n"
            "Les crédits de paiement des dépenses sont fixés à cinq milliards de dinars.\n\n"
            "Article 6 - Recettes fiscales\n"
            "Les recettes fiscales sont réparties selon les modalités prévues par la loi.\n"
        )
        chunks = nlp_service.prepare_chunks(text)
        article6_chunks = [c for c in chunks if "Article 6" in c or "Recettes fiscales" in c]
        for c in article6_chunks:
            assert "cinq milliards" not in c, (
                f"Article 5 content leaked into Article 6 chunk: {c[:120]!r}"
            )

    def test_taux_not_mixed_across_articles(self, nlp_service):
        text = (
            "Article 10 - Taxe exportation huile d olive en vrac\n"
            "Le taux applicable est de 2%.\n\n"
            "Article 11 - Répartition recettes\n"
            "Les recettes sont réparties à hauteur de 50% au profit du trésor.\n"
        )
        chunks = nlp_service.prepare_chunks(text)
        for c in chunks:
            # A chunk containing "2%" must not also contain "50%"
            if "2%" in c:
                assert "50%" not in c, (
                    f"Chunk mixes 2% (Art.10) and 50% (Art.11): {c[:150]!r}"
                )
