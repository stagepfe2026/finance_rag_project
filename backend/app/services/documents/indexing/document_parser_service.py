# app/services/documents/indexing/document_parser_service.py
from app.infrastructure.parsers.pdf_parser import PdfParser
from app.infrastructure.parsers.word_parser import WordParser


class DocumentParserService:
    # Initialise les parsers PDF et Word.
    def __init__(self):
        self.pdf_parser = PdfParser()
        self.word_parser = WordParser()

    # Extrait le texte d'un fichier selon son extension (.pdf ou .docx).
    def parse_document(self, file_path: str, extension: str) -> str:
        ext = extension.lower()

        if ext == ".pdf":
            return self.pdf_parser.extract_text(file_path)
        elif ext == ".docx":
            return self.word_parser.extract_text(file_path)

        raise ValueError(f"Type de fichier non supporté: {extension}")
