import re


class NLPProvider:
    FRENCH_STOP_WORDS = {
        "de",
        "la",
        "le",
        "les",
        "du",
        "des",
        "et",
        "a",
        "au",
        "aux",
        "un",
        "une",
        "en",
        "dans",
        "pour",
        "par",
        "sur",
        "avec",
        "que",
    }

    def clean_text(self, text: str) -> str:
        text = text.replace("\xa0", " ")
        text = re.sub(r"\r\n?", "\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n[ \t]+", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    def sentence_segmentation(self, text: str) -> list[str]:
        return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]

    def tokenize_words(self, text: str) -> list[str]:
        return re.findall(r"\w+", text.lower())

    def remove_stopwords(self, tokens: list[str]) -> list[str]:
        return [token for token in tokens if token not in self.FRENCH_STOP_WORDS]

    def detect_articles(self, text: str) -> list[dict]:
        matches = list(re.finditer(r"Article\s+\d+\s*-?", text))
        articles = []

        for i, match in enumerate(matches):
            start = match.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            chunk = text[start:end].strip()
            article_title = match.group(0)
            articles.append({"article_title": article_title, "content": chunk})

        return articles

    def chunk_by_article(self, text: str) -> list[str]:
        articles = self.detect_articles(text)
        return [article["content"] for article in articles if article["content"]]

    def detect_document_structure(self, text: str) -> str:
        article_matches = re.findall(r"(?m)^Article\s+\d+", text)

        if len(article_matches) >= 2:
            return "article_structured"

        return "unstructured"
