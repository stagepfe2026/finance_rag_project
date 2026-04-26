from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, Response, UploadFile, status
from fastapi.responses import FileResponse

from app.api.dependencies.auth_dependencies import require_admin_user, require_finance_or_admin_user
from app.schemas import ReclamationResolveRequest

router = APIRouter(dependencies=[Depends(require_finance_or_admin_user)])


@router.get("")
async def list_reclamations(request: Request, current_user: dict = Depends(require_finance_or_admin_user)):
    service = getattr(request.app.state, "reclamation_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service de reclamation non disponible.")

    try:
        return {
            "success": True,
            "message": "Reclamations chargees avec succes.",
            "data": service.list_reclamations(current_user),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{reclamation_id}")
async def get_reclamation(
    request: Request,
    reclamation_id: str,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = getattr(request.app.state, "reclamation_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service de reclamation non disponible.")

    try:
        return {
            "success": True,
            "message": "Reclamation chargee avec succes.",
            "data": service.get_reclamation(current_user, reclamation_id),
        }
    except ValueError as exc:
        if str(exc) == "RECLAMATION_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Reclamation introuvable.") from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{reclamation_id}/attachment")
async def get_reclamation_attachment(
    request: Request,
    reclamation_id: str,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = getattr(request.app.state, "reclamation_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service de reclamation non disponible.")

    try:
        file_path, media_type = service.get_reclamation_attachment_response_data(current_user, reclamation_id)
        return FileResponse(
            path=file_path,
            media_type=media_type,
            filename=file_path.name,
            headers={"Content-Disposition": f'inline; filename="{file_path.name}"'},
        )
    except ValueError as exc:
        if str(exc) == "RECLAMATION_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Reclamation introuvable.") from exc
        if str(exc) == "ATTACHMENT_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Piece jointe introuvable.") from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/{reclamation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reclamation(
    request: Request,
    reclamation_id: str,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = getattr(request.app.state, "reclamation_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service de reclamation non disponible.")

    try:
        service.delete_reclamation(current_user, reclamation_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except ValueError as exc:
        if str(exc) == "RECLAMATION_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Reclamation introuvable.") from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("")
async def create_reclamation(
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
    subject: Annotated[str, Form(...) ] = "",
    description: Annotated[str, Form(...) ] = "",
    problem_type: Annotated[str, Form(...) ] = "",
    custom_problem_type: Annotated[str | None, Form()] = None,
    priority: Annotated[str, Form(...) ] = "",
    attachment: Annotated[UploadFile | None, File()] = None,
):
    service = getattr(request.app.state, "reclamation_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service de reclamation non disponible.")

    try:
        data = await service.create_reclamation(
            current_user=current_user,
            subject=subject,
            description=description,
            problem_type=problem_type,
            custom_problem_type=custom_problem_type,
            priority=priority,
            attachment=attachment,
        )
        return {
            "success": True,
            "message": "Reclamation envoyee avec succes.",
            "data": data,
        }
    except ValueError as exc:
        errors = {
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
        raise HTTPException(status_code=400, detail=errors.get(str(exc), "Reclamation invalide.")) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/{reclamation_id}/resolve")
async def resolve_reclamation(
    request: Request,
    reclamation_id: str,
    payload: ReclamationResolveRequest,
    current_user: dict = Depends(require_admin_user),
):
    service = getattr(request.app.state, "reclamation_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service de reclamation non disponible.")

    try:
        data = await service.resolve_reclamation(
            reclamation_id,
            admin_user=current_user,
            admin_reply=payload.adminReply,
            status=payload.status.value if hasattr(payload.status, "value") else str(payload.status),
        )
        return {
            "success": True,
            "message": "Reclamation mise a jour avec succes.",
            "data": data,
        }
    except ValueError as exc:
        if str(exc) == "RECLAMATION_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Reclamation introuvable.") from exc
        if str(exc) == "INVALID_ADMIN_STATUS":
            raise HTTPException(status_code=400, detail="Statut admin invalide.") from exc
        if str(exc) == "RECLAMATION_ALREADY_RESOLVED_BY_ADMIN":
            raise HTTPException(status_code=400, detail="Cette reclamation a deja ete traitee par un administrateur.") from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
