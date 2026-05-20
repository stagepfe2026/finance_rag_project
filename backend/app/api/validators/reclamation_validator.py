from pathlib import Path

from fastapi import HTTPException, UploadFile


ALLOWED_RECLAMATION_PROBLEM_TYPES = {
    "BUG_TECHNIQUE",
    "PROBLEME_JURIDIQUE",
    "ERREUR_REPONSE_CHATBOT",
    "AUTRE",
}
ALLOWED_RECLAMATION_PRIORITIES = {"LOW", "NORMAL", "HIGH", "URGENT"}
ALLOWED_RECLAMATION_ATTACHMENT_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"}
MAX_RECLAMATION_ATTACHMENT_SIZE = 5 * 1024 * 1024


def validate_reclamation_payload(
    *,
    subject: str,
    description: str,
    problem_type: str,
    custom_problem_type: str | None,
    priority: str,
) -> dict[str, str | None]:
    normalized_subject = " ".join(subject.split()).strip()
    normalized_description = description.strip()
    normalized_problem_type = problem_type.strip().upper()
    normalized_custom_problem_type = " ".join((custom_problem_type or "").split()).strip() or None
    normalized_priority = priority.strip().upper()

    if len(normalized_subject) < 3:
        raise HTTPException(status_code=400, detail="Le sujet doit contenir au moins 3 caracteres.")
    if len(normalized_subject) > 160:
        raise HTTPException(status_code=400, detail="Le sujet ne doit pas depasser 160 caracteres.")
    if len(normalized_description) < 10:
        raise HTTPException(status_code=400, detail="La description doit contenir au moins 10 caracteres.")
    if len(normalized_description) > 3000:
        raise HTTPException(status_code=400, detail="La description ne doit pas depasser 3000 caracteres.")
    if normalized_problem_type not in ALLOWED_RECLAMATION_PROBLEM_TYPES:
        raise HTTPException(status_code=400, detail="Type de probleme invalide.")
    if normalized_priority not in ALLOWED_RECLAMATION_PRIORITIES:
        raise HTTPException(status_code=400, detail="Priorite invalide.")
    if normalized_problem_type == "AUTRE" and not normalized_custom_problem_type:
        raise HTTPException(status_code=400, detail="Veuillez preciser le type de probleme.")
    if normalized_problem_type != "AUTRE":
        normalized_custom_problem_type = None

    return {
        "subject": normalized_subject,
        "description": normalized_description,
        "problem_type": normalized_problem_type,
        "custom_problem_type": normalized_custom_problem_type,
        "priority": normalized_priority,
    }


async def validate_reclamation_attachment(attachment: UploadFile | None) -> None:
    if attachment is None or not attachment.filename:
        return

    extension = Path(attachment.filename).suffix.lower()
    if extension not in ALLOWED_RECLAMATION_ATTACHMENT_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Format de piece jointe non supporte.")

    content = await attachment.read()
    if len(content) > MAX_RECLAMATION_ATTACHMENT_SIZE:
        raise HTTPException(status_code=400, detail="La piece jointe ne doit pas depasser 5 Mo.")
    await attachment.seek(0)
