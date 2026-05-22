from datetime import UTC, date, datetime

from fastapi import HTTPException, UploadFile

from app.api.validators.common_validator import parse_optional_iso_datetime
from app.schemas import DocumentCategory, LegalDocumentType, LegalRelationType

MAX_DOCUMENT_UPLOAD_SIZE = 20 * 1024 * 1024
ALLOWED_DOCUMENT_EXTENSIONS = (".pdf", ".docx")
WORD_PREVIEW_EXTENSION = ".docx"


def validate_document_filename(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nom de fichier invalide.")
    if not file.filename.lower().endswith(ALLOWED_DOCUMENT_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF et DOCX sont supportes.")


def validate_document_size(file: UploadFile) -> int:
    file_size = getattr(file, "size", None) or 0
    if file_size and file_size > MAX_DOCUMENT_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="Le fichier depasse la taille maximale autorisee.")
    return file_size


async def validate_word_preview_file(file: UploadFile) -> bytes:
    if not file.filename or not file.filename.lower().endswith(WORD_PREVIEW_EXTENSION):
        raise HTTPException(status_code=400, detail="Seuls les fichiers DOCX peuvent etre previsualises en texte.")

    content = await file.read()
    if len(content) > MAX_DOCUMENT_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="Le fichier depasse la taille maximale autorisee.")
    return content


def validate_document_category(category: str) -> None:
    allowed_categories = {item.name for item in DocumentCategory}
    if category not in allowed_categories:
        raise HTTPException(
            status_code=400,
            detail=f"category doit etre une des valeurs suivantes: {', '.join(sorted(allowed_categories))}.",
        )


def validate_document_type(document_type: str | None) -> None:
    if document_type and document_type not in {item.value for item in LegalDocumentType}:
        raise HTTPException(status_code=400, detail="document_type doit etre une valeur valide.")
    if not document_type or document_type == LegalDocumentType.autre.value:
        raise HTTPException(status_code=400, detail="Le type de document est obligatoire.")


ALLOWED_IMPORT_RELATION_TYPES = {LegalRelationType.none.value, LegalRelationType.remplace.value}


def validate_relation_type(relation_type: str | None) -> None:
    if relation_type and relation_type not in ALLOWED_IMPORT_RELATION_TYPES:
        raise HTTPException(status_code=400, detail="relation_type doit etre 'none' ou 'remplace'.")


def validate_document_dates(
    realized_at: str | None,
    date_publication: str | None,
    date_entree_vigueur: str | None,
) -> tuple[datetime | None, datetime | None, datetime]:
    parsed_realized_at = parse_optional_iso_datetime(realized_at, "realized_at")
    parsed_date_publication = parse_optional_iso_datetime(date_publication, "date_publication")
    parsed_date_entree_vigueur = parse_optional_iso_datetime(date_entree_vigueur, "date_entree_vigueur")

    if parsed_date_publication and parsed_date_publication.date() > datetime.now(UTC).date():
        raise HTTPException(status_code=400, detail="La date de publication ne peut pas etre future.")

    if parsed_date_entree_vigueur is None:
        raise HTTPException(status_code=400, detail="La date d entree en vigueur est obligatoire.")

    if parsed_date_publication and parsed_date_entree_vigueur.date() < parsed_date_publication.date():
        raise HTTPException(
            status_code=400,
            detail="La date d entree en vigueur doit etre posterieure ou egale a la date de publication.",
        )

    return parsed_realized_at, parsed_date_publication, parsed_date_entree_vigueur


def normalize_required_title(title: str) -> str:
    normalized_title = " ".join(title.split()).strip()
    if not normalized_title:
        raise HTTPException(status_code=400, detail="Le titre est obligatoire.")
    return normalized_title


def validate_search_date_range(date_from: date | None, date_to: date | None) -> None:
    if date_from and date_to and date_from > date_to:
        raise HTTPException(
            status_code=400,
            detail="date_from doit etre anterieure ou egale a date_to.",
        )
