import re

import spacy

# Matches all article formats used in Tunisian and French legal documents:
#   Article 5, Article 5bis, Article 5ter, Article Premier, Article 1er
#   Art. 5, Art 5, ART. 5, ARTICLE 5
#   Separators: dash, colon, em-dash, period (all optional)
_ARTICLE_RE = re.compile(
    r"(?:Article|Art\.?)\s+"
    r"(?:Premier|1er|\d+(?:bis|ter|quater|quinquies)?)"
    r"(?:\s*[-:–—\.])?",
    re.IGNORECASE,
)


class FrenchNlpProvider:
    def __init__(self):
        self.nlp = spacy.load("fr_core_news_md")

    def clean_text(self, text: str) -> str:
        text = text.replace("\xa0", " ")
        text = re.sub(r"\r\n?", "\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n[ \t]+", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    def split_into_sentences(self, text: str) -> list[str]:
        doc = self.nlp(text)
        return [sent.text.strip() for sent in doc.sents if sent.text.strip()]

    def tokenize_words(self, text: str) -> list[str]:
        doc = self.nlp(text.lower())
        return [token.text for token in doc if not token.is_space]

    def remove_stopwords(self, tokens: list[str]) -> list[str]:
        stopwords = self.nlp.Defaults.stop_words
        return [t for t in tokens if t.lower() not in stopwords]

    def tokenize_for_lexical_search(self, text: str) -> set[str]:
        doc = self.nlp(text.lower())
        return {
            token.lemma_
            for token in doc
            if not token.is_stop
            and not token.is_punct
            and not token.is_space
            and len(token.text) > 2
        }

    def detect_articles(self, text: str) -> list[dict]:
        matches = list(_ARTICLE_RE.finditer(text))
        articles = []
        for i, match in enumerate(matches):
            start = match.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            chunk = text[start:end].strip()
            articles.append({"article_title": match.group(0), "content": chunk})
        return articles

    def extract_article_header(self, text: str) -> str:
        """Return the article identifier + title from the first line (max 100 chars).

        Used to prefix continuation sub-chunks so the article identity is
        preserved even when a long article is split into multiple word-level chunks.
        """
        first_line = text.split("\n", 1)[0].strip()
        if _ARTICLE_RE.match(first_line):
            return first_line[:100]
        return ""

    def extract_article_number(self, chunk_text: str) -> str | None:
        """Extract the article number token (e.g. '5', '5bis', 'Premier') from a chunk.

        Inspects the first line, stripping any leading bracket from a header
        injection prefix (e.g. '[Article 5 - Titre]').  Returns None when the
        chunk does not start with a recognised article marker.

        This value is stored as a dedicated Qdrant payload field so that
        retrieval can group and filter by article without parsing free text.
        """
        first_part = chunk_text.lstrip("[").split("]", 1)[0].split("\n", 1)[0].strip()
        match = _ARTICLE_RE.search(first_part)
        if not match:
            return None
        num_match = re.search(
            r"Premier|1er|\d+(?:bis|ter|quater|quinquies)?",
            match.group(0),
            re.IGNORECASE,
        )
        return num_match.group(0).strip() if num_match else None

    def extract_article_title(self, chunk_text: str) -> str | None:
        """Extract the descriptive title that follows the article identifier.

        Example: 'Article 5 - Crédits de paiement' → 'Crédits de paiement'
        Returns None when no recognisable title follows the article marker.
        """
        first_part = chunk_text.lstrip("[").split("]", 1)[0].split("\n", 1)[0].strip()
        match = _ARTICLE_RE.search(first_part)
        if not match:
            return None
        after = first_part[match.end():].lstrip(" -:–—.").strip()
        return after[:120] if after else None

    def chunk_by_article(self, text: str) -> list[str]:
        articles = self.detect_articles(text)
        return [article["content"] for article in articles if article["content"]]

    def detect_document_structure(self, text: str) -> str:
        # Use the same robust pattern for structure detection
        if len(_ARTICLE_RE.findall(text)) >= 2:
            return "article_structured"
        return "unstructured"
