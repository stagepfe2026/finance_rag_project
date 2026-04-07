# app/infrastructure/parsers/word_parser.py

from pypdf import PdfReader


class PdfParser:
    def parse(self, file_path: str) -> str:
        reader = PdfReader(file_path)
        text = []
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text.append(extracted)
        return "\n".join(text)
