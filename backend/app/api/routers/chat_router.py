from app.api.dependencies.auth_dependencies import require_admin_user, require_finance_or_admin_user
from app.api.dependencies.service_dependencies import get_chat_service, get_document_index_service
from app.api.errors.chat_error_mapper import raise_chat_http_error
from app.api.utils.audit_helper import try_log_audit
from app.api.utils.response_builder import ok_response
from app.api.validators.chat_validator import (
    normalize_optional_id,
    normalize_required_chat_content,
    normalize_required_summary,
    validate_chat_feedback,
)
from app.schemas.chat_schema import ChatAskRequest, ChatConversationRenameRequest, ChatMessageFeedbackRequest
from fastapi import APIRouter, BackgroundTasks, Depends, Request, Response, status
from fastapi.responses import FileResponse

router = APIRouter(dependencies=[Depends(require_finance_or_admin_user)])


@router.get("/conversations")
async def list_conversations(request: Request, current_user: dict = Depends(require_finance_or_admin_user)):
    service = get_chat_service(request)
    return ok_response(data=service.get_conversations(str(current_user.get("id", ""))))


@router.post("/conversations")
async def create_conversation(request: Request, current_user: dict = Depends(require_finance_or_admin_user)):
    service = get_chat_service(request)
    return ok_response(data=service.start_conversation(str(current_user.get("id", ""))))


@router.patch("/conversations/{conversation_id}")
async def rename_conversation(
    conversation_id: str,
    payload: ChatConversationRenameRequest,
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = get_chat_service(request)
    normalized_conversation_id = normalize_optional_id(conversation_id, "conversation_id")
    normalized_summary = normalize_required_summary(payload.title)

    try:
        data = service.rename_conversation(
            str(current_user.get("id", "")),
            normalized_conversation_id,
            normalized_summary,
        )
    except ValueError as exc:
        raise_chat_http_error(exc)

    return ok_response(message="Conversation renommee avec succes.", data=data)


@router.post("/conversations/{conversation_id}/archive")
async def archive_conversation(
    conversation_id: str,
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = get_chat_service(request)
    normalized_conversation_id = normalize_optional_id(conversation_id, "conversation_id")

    try:
        data = service.archive_conversation(str(current_user.get("id", "")), normalized_conversation_id)
    except ValueError as exc:
        raise_chat_http_error(exc)

    return ok_response(message="Conversation archivee avec succes.", data=data)


@router.post("/conversations/{conversation_id}/restore")
async def restore_conversation(
    conversation_id: str,
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = get_chat_service(request)
    normalized_conversation_id = normalize_optional_id(conversation_id, "conversation_id")

    try:
        data = service.restore_conversation(str(current_user.get("id", "")), normalized_conversation_id)
    except ValueError as exc:
        raise_chat_http_error(exc)

    return ok_response(message="Conversation restauree avec succes.", data=data)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = get_chat_service(request)
    normalized_conversation_id = normalize_optional_id(conversation_id, "conversation_id")

    try:
        service.delete_conversation(str(current_user.get("id", "")), normalized_conversation_id)
    except ValueError as exc:
        raise_chat_http_error(exc)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/conversations/{conversation_id}/messages")
async def list_messages(
    conversation_id: str,
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = get_chat_service(request)
    normalized_conversation_id = normalize_optional_id(conversation_id, "conversation_id")

    try:
        data = service.get_messages(str(current_user.get("id", "")), normalized_conversation_id)
    except ValueError as exc:
        raise_chat_http_error(exc)

    return ok_response(data=data)


@router.get("/sources/{document_id}/download")
async def download_source_document(
    document_id: str,
    request: Request,
    _: dict = Depends(require_finance_or_admin_user),
):
    service = get_document_index_service(request)
    normalized_document_id = normalize_optional_id(document_id, "document_id")

    file_path, media_type = service.get_document_file_response_data(normalized_document_id)
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=file_path.name,
        headers={"Content-Disposition": f'attachment; filename="{file_path.name}"'},
    )


@router.patch("/messages/{message_id}/feedback")
async def set_message_feedback(
    message_id: str,
    payload: ChatMessageFeedbackRequest,
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = get_chat_service(request)
    normalized_message_id = normalize_optional_id(message_id, "message_id")
    normalized_feedback = validate_chat_feedback(payload.feedback)

    try:
        data = service.set_message_feedback(
            user_id=str(current_user.get("id", "")),
            message_id=normalized_message_id,
            feedback=normalized_feedback,
        )
    except ValueError as exc:
        raise_chat_http_error(exc)

    return ok_response(message="Avis enregistre avec succes.", data=data)


@router.get("/feedback/stats")
async def get_chat_feedback_stats(
    request: Request,
    _: dict = Depends(require_admin_user),
):
    service = get_chat_service(request)

    return ok_response(data=service.get_feedback_stats())


@router.get("/messages/generating")
async def get_generating_messages(
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = get_chat_service(request)

    return ok_response(data=service.get_generating_messages(str(current_user.get("id", ""))))


@router.post("/ask")
async def ask_chat(
    payload: ChatAskRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = get_chat_service(request)
    normalized_content = normalize_required_chat_content(payload.content)
    normalized_conversation_id = normalize_optional_id(payload.conversation_id, "conversation_id")

    try:
        data = service.ask_pending(
            user_id=str(current_user.get("id", "")),
            content=normalized_content,
            conversation_id=normalized_conversation_id,
            response_mode=payload.response_mode,
            query_mode=payload.query_mode.value,
        )
    except ValueError as exc:
        raise_chat_http_error(exc)

    background_tasks.add_task(
        service.run_rag_background,
        assistant_message_id=data["assistantMessage"]["_id"],
        conversation_id=data["conversation"]["_id"],
        content=normalized_content,
        response_mode=payload.response_mode,
        query_mode=payload.query_mode.value,
    )

    try_log_audit(
        request,
        "log_chat_message",
        current_user=current_user,
        content=normalized_content,
        conversation_id=data.get("conversation", {}).get("_id", "") or "",
    )
    return ok_response(message="Message recu, generation en cours.", data=data)
