from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, Response, UploadFile, status
from fastapi.responses import FileResponse

from app.api.dependencies.auth_dependencies import require_admin_user, require_finance_or_admin_user
from app.api.dependencies.service_dependencies import get_reclamation_service
from app.api.errors.reclamation_error_mapper import raise_reclamation_http_error
from app.api.utils.audit_helper import try_log_audit
from app.api.utils.exception_handler import internal_server_error
from app.api.utils.response_builder import ok_response
from app.api.validators.reclamation_validator import (
    validate_reclamation_attachment,
    validate_reclamation_payload,
)
from app.schemas import ReclamationResolveRequest

router = APIRouter(dependencies=[Depends(require_finance_or_admin_user)])


@router.get("")
async def list_reclamations(request: Request, current_user: dict = Depends(require_finance_or_admin_user)):
    service = get_reclamation_service(request)

    try:
        return ok_response(message="Reclamations chargees avec succes.", data=await service.list_reclamations(current_user))
    except Exception as exc:
        raise internal_server_error(exc, "Reclamation listing") from exc


@router.get("/{reclamation_id}")
async def get_reclamation(
    request: Request,
    reclamation_id: str,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = get_reclamation_service(request)

    try:
        return ok_response(message="Reclamation chargee avec succes.", data=service.get_reclamation(current_user, reclamation_id))
    except ValueError as exc:
        raise_reclamation_http_error(exc)
    except Exception as exc:
        raise internal_server_error(exc, "Reclamation detail loading") from exc


@router.post("/{reclamation_id}/mark-reply-read")
async def mark_reclamation_reply_read(
    request: Request,
    reclamation_id: str,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = get_reclamation_service(request)

    try:
        return ok_response(message="Reponse marquee comme lue.", data=service.mark_reply_read(current_user, reclamation_id))
    except ValueError as exc:
        raise_reclamation_http_error(exc)
    except Exception as exc:
        raise internal_server_error(exc, "Reclamation reply read marking") from exc


@router.get("/{reclamation_id}/attachment")
async def get_reclamation_attachment(
    request: Request,
    reclamation_id: str,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = get_reclamation_service(request)

    try:
        file_path, media_type = service.get_reclamation_attachment_response_data(current_user, reclamation_id)
        return FileResponse(
            path=file_path,
            media_type=media_type,
            filename=file_path.name,
            headers={"Content-Disposition": f'inline; filename="{file_path.name}"'},
        )
    except ValueError as exc:
        raise_reclamation_http_error(exc)
    except Exception as exc:
        raise internal_server_error(exc, "Reclamation attachment loading") from exc


@router.delete("/{reclamation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reclamation(
    request: Request,
    reclamation_id: str,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = get_reclamation_service(request)

    try:
        service.delete_reclamation(current_user, reclamation_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except ValueError as exc:
        raise_reclamation_http_error(exc)
    except Exception as exc:
        raise internal_server_error(exc, "Reclamation deletion") from exc


@router.put("/{reclamation_id}")
async def update_reclamation(
    request: Request,
    reclamation_id: str,
    current_user: dict = Depends(require_finance_or_admin_user),
    subject: Annotated[str, Form(...) ] = "",
    description: Annotated[str, Form(...) ] = "",
    problem_type: Annotated[str, Form(...) ] = "",
    custom_problem_type: Annotated[str | None, Form()] = None,
    priority: Annotated[str, Form(...) ] = "",
    attachment: Annotated[UploadFile | None, File()] = None,
):
    service = get_reclamation_service(request)
    validated_payload = validate_reclamation_payload(
        subject=subject,
        description=description,
        problem_type=problem_type,
        custom_problem_type=custom_problem_type,
        priority=priority,
    )
    await validate_reclamation_attachment(attachment)

    try:
        data = await service.update_reclamation(
            current_user=current_user,
            reclamation_id=reclamation_id,
            subject=validated_payload["subject"] or "",
            description=validated_payload["description"] or "",
            problem_type=validated_payload["problem_type"] or "",
            custom_problem_type=validated_payload["custom_problem_type"],
            priority=validated_payload["priority"] or "",
            attachment=attachment,
        )
        try_log_audit(request, "log_reclamation_action", current_user=current_user, action_type="RECLAMATION_UPDATED", action_label="Reclamation modifiee", reclamation_id=reclamation_id, subject=validated_payload["subject"] or "")
        return ok_response(message="Reclamation modifiee avec succes.", data=data)
    except ValueError as exc:
        raise_reclamation_http_error(exc, include_form_errors=True)
    except Exception as exc:
        raise internal_server_error(exc, "Reclamation update") from exc


@router.post("")
async def submit_reclamation(
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
    subject: Annotated[str, Form(...) ] = "",
    description: Annotated[str, Form(...) ] = "",
    problem_type: Annotated[str, Form(...) ] = "",
    custom_problem_type: Annotated[str | None, Form()] = None,
    priority: Annotated[str, Form(...) ] = "",
    attachment: Annotated[UploadFile | None, File()] = None,
):
    service = get_reclamation_service(request)
    validated_payload = validate_reclamation_payload(
        subject=subject,
        description=description,
        problem_type=problem_type,
        custom_problem_type=custom_problem_type,
        priority=priority,
    )
    await validate_reclamation_attachment(attachment)

    try:
        data = await service.create_reclamation(
            current_user=current_user,
            subject=validated_payload["subject"] or "",
            description=validated_payload["description"] or "",
            problem_type=validated_payload["problem_type"] or "",
            custom_problem_type=validated_payload["custom_problem_type"],
            priority=validated_payload["priority"] or "",
            attachment=attachment,
        )
        try_log_audit(request, "log_reclamation_action", current_user=current_user, action_type="RECLAMATION_CREATED", action_label="Reclamation soumise", reclamation_id=str(data.get("id", "")), subject=validated_payload["subject"] or "")
        return ok_response(message="Reclamation envoyee avec succes.", data=data)
    except ValueError as exc:
        raise_reclamation_http_error(exc, include_form_errors=True)
    except Exception as exc:
        raise internal_server_error(exc, "Reclamation creation") from exc


@router.post("/{reclamation_id}/take", status_code=status.HTTP_200_OK)
async def assign_to_me(
    request: Request,
    reclamation_id: str,
    current_user: dict = Depends(require_admin_user),
):
    service = get_reclamation_service(request)

    try:
        data = await service.take_reclamation(current_user, reclamation_id)
        try_log_audit(request, "log_reclamation_action", current_user=current_user, action_type="RECLAMATION_TAKEN", action_label="Prise en charge", reclamation_id=reclamation_id, subject=str(data.get("subject", "")))
        return ok_response(message="Reclamation prise en charge avec succes.", data=data)
    except ValueError as exc:
        raise_reclamation_http_error(exc)
    except Exception as exc:
        raise internal_server_error(exc, "Reclamation assignment") from exc


@router.post("/{reclamation_id}/resolve")
async def resolve_reclamation(
    request: Request,
    reclamation_id: str,
    payload: ReclamationResolveRequest,
    current_user: dict = Depends(require_admin_user),
):
    service = get_reclamation_service(request)

    try:
        data = await service.resolve_reclamation(
            reclamation_id,
            admin_user=current_user,
            admin_reply=payload.adminReply,
            status=payload.status.value if hasattr(payload.status, "value") else str(payload.status),
        )
        try_log_audit(request, "log_reclamation_action", current_user=current_user, action_type="RECLAMATION_RESOLVED", action_label="Reclamation resolue", reclamation_id=reclamation_id, subject=str(data.get("subject", "")))
        return ok_response(message="Reclamation mise a jour avec succes.", data=data)
    except ValueError as exc:
        raise_reclamation_http_error(exc)
    except Exception as exc:
        raise internal_server_error(exc, "Reclamation resolution") from exc
