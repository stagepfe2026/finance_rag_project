from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse

from app.api.dependencies.auth_dependencies import require_finance_or_admin_user
from app.api.dependencies.service_dependencies import get_document_index_service
from app.api.utils.audit_helper import get_current_user, get_optional_audit_service, try_log_audit
from app.api.validators.document_validator import validate_search_date_range
from app.schemas import DocumentActionResponse, DocumentCategory, DocumentPreviewOut, DocumentSearchResponse

router = APIRouter(dependencies=[Depends(require_finance_or_admin_user)])


@router.get("", response_model=DocumentSearchResponse)
async def search_documents(
    request: Request,
    query: Annotated[str | None, Query()] = None,
    title: Annotated[str | None, Query()] = None,
    categories: Annotated[list[DocumentCategory] | None, Query()] = None,
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    favorites_only: Annotated[bool, Query()] = False,
    sort_by: Annotated[str, Query(pattern="^(recent|title)$")] = "recent",
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
):
    service = get_document_index_service(request)
    validate_search_date_range(date_from, date_to)

    current_user = get_current_user(request)
    audit_service = get_optional_audit_service(request)
    service.publish_scheduled_documents(audit_service=audit_service)
    result = service.search_documents(
        query=query,
        title=title,
        categories=[item.value for item in categories] if categories else None,
        date_from=date_from,
        date_to=date_to,
        favorites_only=favorites_only,
        current_user_id=current_user.get("id"),
        sort_by=sort_by,
        skip=skip,
        limit=limit,
    )
    try_log_audit(
        request,
        "log_document_action",
        current_user=current_user,
        action_type="DOCUMENT_SEARCH",
        action_label="Recherche document",
        entity_type="DOCUMENT_SEARCH",
        entity_id="",
        entity_label=query or title or "Recherche documents",
        summary=f"{current_user.get('prenom', '')} {current_user.get('nom', '')}".strip()
        + " a recherche des documents.",
        metadata={
            "query": query or "",
            "title": title or "",
            "categories": ", ".join(item.value for item in categories) if categories else "",
            "dateFrom": date_from.isoformat() if date_from else "",
            "dateTo": date_to.isoformat() if date_to else "",
            "favoritesOnly": favorites_only,
            "sortBy": sort_by,
            "resultats": result.total,
        },
    )
    return result


@router.get("/{document_id}/preview", response_model=DocumentPreviewOut)
async def get_document_preview(request: Request, document_id: str):
    service = get_document_index_service(request)

    preview = service.get_document_preview(document_id)
    current_user = get_current_user(request)
    try_log_audit(
        request,
        "log_document_action",
        current_user=current_user,
        action_type="DOCUMENT_PREVIEW",
        action_label="Consultation document",
        entity_type="DOCUMENT",
        entity_id=document_id,
        entity_label=preview.title,
        summary=f"{current_user.get('prenom', '')} {current_user.get('nom', '')}".strip()
        + " a consulte l apercu d un document.",
        metadata={"documentId": document_id, "titre": preview.title, "categorie": preview.category.value},
    )
    return preview


@router.get("/{document_id}/file")
async def get_document_file(request: Request, document_id: str):
    service = get_document_index_service(request)

    file_path, media_type = service.get_document_file_response_data(document_id)
    current_user = get_current_user(request)
    try_log_audit(
        request,
        "log_document_action",
        current_user=current_user,
        action_type="DOCUMENT_OPEN_FILE",
        action_label="Ouverture document",
        entity_type="DOCUMENT",
        entity_id=document_id,
        entity_label=file_path.name,
        summary=f"{current_user.get('prenom', '')} {current_user.get('nom', '')}".strip()
        + " a ouvert le fichier d un document.",
        metadata={"documentId": document_id, "fichier": file_path.name, "mediaType": media_type},
    )
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=file_path.name,
        headers={"Content-Disposition": f'inline; filename="{file_path.name}"'},
    )


@router.post("/{document_id}/favorite", response_model=DocumentActionResponse)
async def add_document_to_favorites(request: Request, document_id: str):
    service = get_document_index_service(request)

    current_user = get_current_user(request)
    result = service.set_document_favorite(
        document_id,
        True,
        current_user_id=str(current_user.get("id", "")),
    )
    try_log_audit(
        request,
        "log_document_action",
        current_user=current_user,
        action_type="DOCUMENT_FAVORITE_ADDED",
        action_label="Ajout favori",
        entity_type="DOCUMENT",
        entity_id=document_id,
        entity_label=result.data.title if result.data else document_id,
        summary=f"{current_user.get('prenom', '')} {current_user.get('nom', '')}".strip()
        + " a ajoute un document aux favoris.",
        metadata={"documentId": document_id},
    )
    return result


@router.delete("/{document_id}/favorite", response_model=DocumentActionResponse)
async def remove_document_from_favorites(request: Request, document_id: str):
    service = get_document_index_service(request)

    current_user = get_current_user(request)
    result = service.set_document_favorite(
        document_id,
        False,
        current_user_id=str(current_user.get("id", "")),
    )
    try_log_audit(
        request,
        "log_document_action",
        current_user=current_user,
        action_type="DOCUMENT_FAVORITE_REMOVED",
        action_label="Retrait favori",
        entity_type="DOCUMENT",
        entity_id=document_id,
        entity_label=result.data.title if result.data else document_id,
        summary=f"{current_user.get('prenom', '')} {current_user.get('nom', '')}".strip()
        + " a retire un document des favoris.",
        metadata={"documentId": document_id},
    )
    return result
