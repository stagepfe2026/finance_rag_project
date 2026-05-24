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

    def tokenize_words(self, text: str) -> list[str]:
        doc = self.nlp(text.lower())
        return [token.text for token in doc if not token.is_space]

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

    def chunk_by_article(self, text: str) -> list[str]:
        articles = self.detect_articles(text)
        return [article["content"] for article in articles if article["content"]]

    def detect_document_structure(self, text: str) -> str:
        # Use the same robust pattern for structure detection
        if len(_ARTICLE_RE.findall(text)) >= 2:
            return "article_structured"
        return "unstructured"
