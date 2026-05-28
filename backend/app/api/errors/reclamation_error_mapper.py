from fastapi import HTTPException

RECLAMATION_FORM_ERRORS = {
    "SUBJECT_TOO_SHORT": "Le sujet doit contenir au moins 3 caracteres.",
    "SUBJECT_TOO_LONG": "Le sujet ne doit pas depasser 160 caracteres.",
    "DESCRIPTION_TOO_SHORT": "La description doit contenir au moins 10 caracteres.",
    "DESCRIPTION_TOO_LONG": "La description ne doit pas depasser 3000 caracteres.",
    "INVALID_PROBLEM_TYPE": "Type de probleme invalide.",
    "CUSTOM_PROBLEM_TYPE_REQUIRED": "Veuillez preciser le type de probleme.",
    "INVALID_PRIORITY": "Priorite invalide.",
    "INVALID_ATTACHMENT_TYPE": "Format de piece jointe non supporte.",
    "ATTACHMENT_TOO_LARGE": "La piece jointe ne doit pas depasser 5 Mo.",
}

RECLAMATION_ACTION_ERRORS = {
    "RECLAMATION_NOT_FOUND": (404, "Reclamation introuvable."),
    "ATTACHMENT_NOT_FOUND": (404, "Piece jointe introuvable."),
    "RECLAMATION_DELETE_NOT_ALLOWED": (
        403,
        "Cette reclamation ne peut plus etre supprimee car elle est deja prise en charge.",
    ),
    "RECLAMATION_UPDATE_NOT_ALLOWED": (
        403,
        "Seules les reclamations en attente peuvent etre modifiees.",
    ),
    "RECLAMATION_ALREADY_HANDLED": (
        409,
        "Cette reclamation est deja prise en charge ou cloturee.",
    ),
    "RECLAMATION_NOT_IN_PROGRESS": (
        409,
        "La reclamation doit etre prise en charge avant de pouvoir etre resolue.",
    ),
    "INVALID_ADMIN_STATUS": (400, "Statut admin invalide."),
    "RECLAMATION_ALREADY_RESOLVED_BY_ADMIN": (
        400,
        "Cette reclamation a deja ete traitee par un administrateur.",
    ),
    "ADMIN_REPLY_TOO_SHORT": (400, "La reponse admin doit contenir au moins 3 caracteres."),
}


def raise_reclamation_http_error(exc: ValueError, *, include_form_errors: bool = False) -> None:
    code = str(exc)

    action_error = RECLAMATION_ACTION_ERRORS.get(code)
    if action_error is not None:
        status_code, message = action_error
        raise HTTPException(status_code=status_code, detail=message) from exc

    if include_form_errors and code in RECLAMATION_FORM_ERRORS:
        raise HTTPException(status_code=400, detail=RECLAMATION_FORM_ERRORS[code]) from exc

    raise HTTPException(status_code=400, detail=str(exc)) from exc
