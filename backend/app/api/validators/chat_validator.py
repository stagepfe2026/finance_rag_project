from fastapi import HTTPException


def normalize_required_chat_content(content: str | None) -> str:
    normalized_content = (content or "").strip()
    if not normalized_content:
        raise HTTPException(status_code=400, detail="Le message est obligatoire.")
    return normalized_content


def normalize_optional_id(value: str | None, field_name: str) -> str | None:
    if value is None:
        return None

    normalized_value = value.strip()
    if not normalized_value:
        raise HTTPException(status_code=400, detail=f"{field_name} ne doit pas etre vide.")
    return normalized_value


def normalize_required_summary(summary: str) -> str:
    normalized_summary = " ".join(summary.split()).strip()
    if not normalized_summary:
        raise HTTPException(status_code=400, detail="Le titre de la conversation est obligatoire.")
    if len(normalized_summary) > 120:
        raise HTTPException(status_code=400, detail="Le titre de la conversation ne doit pas depasser 120 caracteres.")
    return normalized_summary


def validate_chat_feedback(feedback: str | None) -> str | None:
    if feedback is None:
        return None
    if feedback not in {"like", "dislike"}:
        raise HTTPException(status_code=400, detail="Avis invalide.")
    return feedback
