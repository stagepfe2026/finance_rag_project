"""Tests for RagService._strip_source_tags — post-processing of LLM output.

Run:  cd backend && python -m pytest tests/test_rag_service_strip.py -v
"""
from app.services.rag.pipeline.rag_service import RagService

_strip = RagService._strip_source_tags


class TestStripSourceTags:
    def test_removes_single_tag(self):
        assert "[Source 1]" not in _strip("Selon [Source 1], l'article 38 fixe les taxes.")

    def test_removes_multiple_tags(self):
        result = _strip("Voir [Source 1] et [Source 2] pour les détails.")
        assert "[Source 1]" not in result
        assert "[Source 2]" not in result

    def test_no_double_space_after_removal(self):
        result = _strip("Selon [Source 2], article 38 est applicable.")
        assert "  " not in result

    def test_no_orphan_comma_before_tag(self):
        # "Selon [Source 2], article" → "Selon article" (comma consumed)
        result = _strip("Selon [Source 2], article 38.")
        assert result == "Selon article 38."

    def test_tag_at_start(self):
        result = _strip("[Source 1] L'article 38 fixe les taxes.")
        assert result == "L'article 38 fixe les taxes."

    def test_tag_at_end(self):
        result = _strip("L'article 38 fixe les taxes. [Source 1]")
        assert result == "L'article 38 fixe les taxes."

    def test_no_tags_unchanged(self):
        text = "L'article 38 fixe les taxes sur l'huile d'olive."
        assert _strip(text) == text

    def test_empty_string(self):
        assert _strip("") == ""

    def test_tag_with_space_variant(self):
        assert "[Source  3]" not in _strip("Texte [Source  3] juridique.")
