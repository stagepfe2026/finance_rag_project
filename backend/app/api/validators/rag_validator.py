from fastapi import HTTPException


def normalize_rag_question(question: str | None) -> str:
    normalized_question = (question or "").strip()
    if not normalized_question:
        raise HTTPException(status_code=400, detail="La question est obligatoire.")
    if len(normalized_question) > 4000:
        raise HTTPException(status_code=400, detail="La question ne doit pas depasser 4000 caracteres.")
    return normalized_question
