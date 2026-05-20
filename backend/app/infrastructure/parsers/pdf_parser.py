# app/infrastructure/parsers/word_parser.py

from pypdf import PdfReader


from app.infrastructure.parsers.base_document_parser import BaseDocumentParser


class PdfParser(BaseDocumentParser):
    def extract_text(self, file_path: str) -> str:
        reader = PdfReader(file_path)
        text = []
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text.append(extracted)
        return "\n".join(text)
