import re

import spacy


class NLPProvider:
    def __init__(self):
        self.nlp = spacy.load("fr_core_news_md")

    def clean_text(self, text: str) -> str:
        text = text.replace("\xa0", " ")
        text = re.sub(r"\r\n?", "\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n[ \t]+", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    def sentence_segmentation(self, text: str) -> list[str]:
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
