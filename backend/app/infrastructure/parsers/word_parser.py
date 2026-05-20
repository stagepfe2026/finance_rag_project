# app/infrastructure/parsers/word_parser.py
from docx import Document


from app.infrastructure.parsers.base_document_parser import BaseDocumentParser


class WordParser(BaseDocumentParser):
    def extract_text(self, file_path: str) -> str:
        doc = Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
