from fastapi import HTTPException, status

CHAT_ERROR_RESPONSES = {
    "CONVERSATION_NOT_FOUND": (
        status.HTTP_404_NOT_FOUND,
        "Conversation introuvable.",
    ),
    "EMPTY_MESSAGE": (
        status.HTTP_400_BAD_REQUEST,
        "Le message est vide.",
    ),
    "EMPTY_SUMMARY": (
        status.HTTP_400_BAD_REQUEST,
        "Le titre de la conversation est vide.",
    ),
    "MESSAGE_NOT_FOUND": (
        status.HTTP_404_NOT_FOUND,
        "Reponse introuvable.",
    ),
    "INVALID_FEEDBACK": (
        status.HTTP_400_BAD_REQUEST,
        "Avis invalide.",
    ),
}


def raise_chat_http_error(exc: ValueError) -> None:
    code = str(exc)
    error_response = CHAT_ERROR_RESPONSES.get(code)
    if error_response is None:
        raise exc

    status_code, message = error_response
    raise HTTPException(
        status_code=status_code,
        detail={"code": code, "message": message},
    ) from exc
