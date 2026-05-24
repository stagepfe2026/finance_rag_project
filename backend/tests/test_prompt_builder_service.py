"""Tests for PromptBuilderService — source citation tags and chunk grouping.

Run:  cd backend && python -m pytest tests/test_prompt_builder_service.py -v
"""
import pytest

from app.services.rag.generation.prompt_builder_service import PromptBuilderService


@pytest.fixture
def builder():
    return PromptBuilderService()


def _make_chunk(
    document_id: str = "doc1",
    article_number: str | None = None,
    text: str = "extrait juridique",
    document_title: str = "Titre",
    category: str = "cat",
    legal_status: str = "actif",
    chunk_index: int = 0,
) -> dict:
    return {
        "document_id": document_id,
        "article_number": article_number,
        "text": text,
        "document_title": document_title,
        "document_name": "",
        "category": category,
        "document_type": "loi",
        "legal_status": legal_status,
        "date_publication": None,
        "date_entree_vigueur": None,
        "relation_type": "none",
        "related_document_id": None,
        "related_document_title": "",
        "realized_at": None,
        "chunk_index": chunk_index,
    }


# ---------------------------------------------------------------------------
# _group_by_document_article
# ---------------------------------------------------------------------------

class TestGroupByDocumentArticle:
    def test_same_document_same_article_grouped(self):
        chunks = [
            _make_chunk(document_id="docA", article_number="5", chunk_index=0),
            _make_chunk(document_id="docB", article_number="1", chunk_index=0),
            _make_chunk(document_id="docA", article_number="5", chunk_index=1),
        ]
        result = PromptBuilderService._group_by_document_article(chunks)
        # Both docA/article5 chunks should be adjacent
        doc_article = [(c["document_id"], c["article_number"]) for c in result]
        a5_positions = [i for i, (d, a) in enumerate(doc_article) if d == "docA" and a == "5"]
        assert a5_positions == list(range(a5_positions[0], a5_positions[0] + len(a5_positions)))

    def test_group_order_follows_first_occurrence(self):
        chunks = [
            _make_chunk(document_id="docB", article_number="1", chunk_index=0),
            _make_chunk(document_id="docA", article_number="5", chunk_index=0),
            _make_chunk(document_id="docB", article_number="1", chunk_index=1),
        ]
        result = PromptBuilderService._group_by_document_article(chunks)
        # docB/1 first appeared at index 0 → its group comes first
        assert result[0]["document_id"] == "docB"
        assert result[2]["document_id"] == "docA"

    def test_different_articles_same_document_not_merged(self):
        chunks = [
            _make_chunk(document_id="docA", article_number="5", chunk_index=0),
            _make_chunk(document_id="docA", article_number="6", chunk_index=0),
        ]
        result = PromptBuilderService._group_by_document_article(chunks)
        assert len(result) == 2
        assert result[0]["article_number"] == "5"
        assert result[1]["article_number"] == "6"

    def test_empty_input_returns_empty(self):
        assert PromptBuilderService._group_by_document_article([]) == []

    def test_single_chunk_preserved(self):
        chunk = _make_chunk(document_id="docA", article_number="1")
        result = PromptBuilderService._group_by_document_article([chunk])
        assert len(result) == 1
        assert result[0]["document_id"] == "docA"


# ---------------------------------------------------------------------------
# format_context — source tags
# ---------------------------------------------------------------------------

class TestFormatContext:
    def test_source_tags_are_added(self, builder):
        chunks = [_make_chunk(chunk_index=0), _make_chunk(document_id="doc2", chunk_index=0)]
        context = builder.format_context(chunks)
        assert "[Source 1]" in context
        assert "[Source 2]" in context

    def test_source_tags_numbered_sequentially(self, builder):
        chunks = [
            _make_chunk(document_id=f"doc{i}", chunk_index=i) for i in range(4)
        ]
        context = builder.format_context(chunks)
        for n in range(1, 5):
            assert f"[Source {n}]" in context

    def test_single_chunk_has_source_1(self, builder):
        context = builder.format_context([_make_chunk()])
        assert "[Source 1]" in context

    def test_empty_chunks_returns_empty_string(self, builder):
        assert builder.format_context([]) == ""

    def test_chunk_text_appears_in_context(self, builder):
        chunk = _make_chunk(text="Le taux est de 2% pour l exportation.")
        context = builder.format_context([chunk])
        assert "Le taux est de 2% pour l exportation." in context

    def test_chunks_separated_by_delimiter(self, builder):
        chunks = [_make_chunk(document_id="d1"), _make_chunk(document_id="d2")]
        context = builder.format_context(chunks)
        assert "---" in context


# ---------------------------------------------------------------------------
# compose_prompt — citation instruction present
# ---------------------------------------------------------------------------

class TestComposePrompt:
    def test_no_inline_citation_instruction_in_prompt(self, builder):
        # The model is not asked to emit [Source N] tags — attribution is handled
        # by the 'sources' field in the API response, not inline citations.
        prompt = builder.compose_prompt(
            question="Quel est le taux applicable ?",
            context="[Source 1]\nTitre: Loi 2024\n...",
            response_mode="detailed",
            question_profile="current",
            query_mode="current",
        )
        assert "Regle de citation" not in prompt

    def test_numerical_grounding_instruction_in_prompt(self, builder):
        prompt = builder.compose_prompt(
            question="Quel est le taux ?",
            context="contexte",
            response_mode="short",
            question_profile="current",
            query_mode="current",
        )
        assert "grounding" in prompt.lower() or "numerique" in prompt.lower()

    def test_article_scope_instruction_in_prompt(self, builder):
        prompt = builder.compose_prompt(
            question="Question juridique.",
            context="contexte",
            response_mode="detailed",
            question_profile="current",
            query_mode="current",
        )
        assert "perimetre" in prompt.lower() or "article" in prompt.lower()
