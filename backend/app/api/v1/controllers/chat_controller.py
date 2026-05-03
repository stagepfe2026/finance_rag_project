from app.api.dependencies.auth_dependencies import require_admin_user, require_finance_or_admin_user
from app.schemas.chat_schema import ChatAskRequest, ChatConversationRenameRequest, ChatMessageFeedbackRequest
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import FileResponse

router = APIRouter(dependencies=[Depends(require_finance_or_admin_user)])


def _raise_chat_error(exc: ValueError) -> None:
    code = str(exc)
    if code == "CONVERSATION_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CONVERSATION_NOT_FOUND", "message": "Conversation introuvable."},
        ) from exc
    if code == "EMPTY_MESSAGE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_MESSAGE", "message": "Le message est vide."},
        ) from exc
    if code == "EMPTY_SUMMARY":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_SUMMARY", "message": "Le titre de la conversation est vide."},
        ) from exc
    if code == "MESSAGE_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "MESSAGE_NOT_FOUND", "message": "Reponse introuvable."},
        ) from exc
    if code == "INVALID_FEEDBACK":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_FEEDBACK", "message": "Avis invalide."},
        ) from exc
    raise exc


@router.get("/conversations")
async def list_conversations(request: Request, current_user: dict = Depends(require_finance_or_admin_user)):
    service = getattr(request.app.state, "chat_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service chat non disponible.")

    return {
        "success": True,
        "data": service.list_conversations(str(current_user.get("id", ""))),
    }


@router.post("/conversations")
async def create_conversation(request: Request, current_user: dict = Depends(require_finance_or_admin_user)):
    service = getattr(request.app.state, "chat_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service chat non disponible.")

    return {
        "success": True,
        "data": service.create_conversation(str(current_user.get("id", ""))),
    }


@router.patch("/conversations/{conversation_id}")
async def rename_conversation(
    conversation_id: str,
    payload: ChatConversationRenameRequest,
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = getattr(request.app.state, "chat_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service chat non disponible.")

    try:
        data = service.rename_conversation(
            str(current_user.get("id", "")),
            conversation_id,
            payload.summary,
        )
    except ValueError as exc:
        _raise_chat_error(exc)

    return {"success": True, "message": "Conversation renommee avec succes.", "data": data}


@router.post("/conversations/{conversation_id}/archive")
async def archive_conversation(
    conversation_id: str,
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = getattr(request.app.state, "chat_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service chat non disponible.")

    try:
        data = service.archive_conversation(str(current_user.get("id", "")), conversation_id)
    except ValueError as exc:
        _raise_chat_error(exc)

    return {"success": True, "message": "Conversation archivee avec succes.", "data": data}


@router.post("/conversations/{conversation_id}/restore")
async def restore_conversation(
    conversation_id: str,
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = getattr(request.app.state, "chat_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service chat non disponible.")

    try:
        data = service.restore_conversation(str(current_user.get("id", "")), conversation_id)
    except ValueError as exc:
        _raise_chat_error(exc)

    return {"success": True, "message": "Conversation restauree avec succes.", "data": data}


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = getattr(request.app.state, "chat_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service chat non disponible.")

    try:
        service.delete_conversation(str(current_user.get("id", "")), conversation_id)
    except ValueError as exc:
        _raise_chat_error(exc)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/conversations/{conversation_id}/messages")
async def list_messages(
    conversation_id: str,
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = getattr(request.app.state, "chat_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service chat non disponible.")

    try:
        data = service.list_messages(str(current_user.get("id", "")), conversation_id)
    except ValueError as exc:
        _raise_chat_error(exc)

    return {
        "success": True,
        "data": data,
    }


@router.get("/sources/{document_id}/download")
async def download_source_document(
    document_id: str,
    request: Request,
    _: dict = Depends(require_finance_or_admin_user),
):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(
            status_code=500,
            detail="Service d indexation de document non disponible.",
        )

    file_path, media_type = service.get_document_file_response_data(document_id)
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
    service = getattr(request.app.state, "chat_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service chat non disponible.")

    try:
        data = service.set_message_feedback(
            user_id=str(current_user.get("id", "")),
            message_id=message_id,
            feedback=payload.feedback,
        )
    except ValueError as exc:
        _raise_chat_error(exc)

    return {"success": True, "message": "Avis enregistre avec succes.", "data": data}


@router.get("/feedback/stats")
async def get_chat_feedback_stats(
    request: Request,
    _: dict = Depends(require_admin_user),
):
    service = getattr(request.app.state, "chat_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service chat non disponible.")

    return {
        "success": True,
        "data": service.get_feedback_stats(),
    }


@router.post("/ask")
async def ask_chat(
    payload: ChatAskRequest,
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = getattr(request.app.state, "chat_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service chat non disponible.")

    try:
        data = service.ask(
            user_id=str(current_user.get("id", "")),
            content=payload.content or "",
            conversation_id=payload.conversation_id,
            response_mode=payload.response_mode,
            query_mode=payload.query_mode.value,
        )
    except ValueError as exc:
        _raise_chat_error(exc)

    return {
        "success": True,
        "message": "Reponse generee avec succes.",
        "data": data,
    }

