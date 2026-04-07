# app/infrastructure/parsers/word_parser.py
from docx import Document


class WordParser:
    def parse(self, file_path: str) -> str:
        doc = Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
