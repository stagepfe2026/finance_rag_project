from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse

from app.api.dependencies.auth_dependencies import require_admin_user
from app.api.dependencies.service_dependencies import get_document_index_service
from app.api.utils.audit_helper import get_current_user, get_optional_audit_service, try_log_audit
from app.api.utils.exception_handler import internal_server_error
from app.api.utils.response_builder import ok_response
from app.api.validators.document_validator import (
    normalize_required_title,
    validate_document_category,
    validate_document_dates,
    validate_document_filename,
    validate_document_size,
    validate_document_type,
    validate_relation_type,
    validate_word_preview_file,
)
from app.schemas import (
    DocumentActionResponse,
    DocumentCategory,
    DocumentListResponse,
    DocumentPreviewOut,
    DocumentStatus,
)

router = APIRouter(dependencies=[Depends(require_admin_user)])

@router.get("", response_model=DocumentListResponse)
async def list_documents(
    request: Request,
    search: Annotated[str | None, Query()] = None,
    category: Annotated[DocumentCategory | None, Query()] = None,
    status: Annotated[DocumentStatus | None, Query()] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
):
    service = get_document_index_service(request)

    try:
        current_user = get_current_user(request)
        audit_service = get_optional_audit_service(request)
        service.publish_scheduled_documents(audit_service=audit_service)
        return service.list_documents(
            search=search,
            category=category.value if category else None,
            status=status.value if status else None,
            current_user_id=current_user.get("id"),
            skip=skip,
            limit=limit,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise internal_server_error(exc, "Document listing") from exc


@router.post("/preview-word")
async def preview_word_document(
    request: Request,
    file: Annotated[UploadFile, File(...)],
):
    content = await validate_word_preview_file(file)

    index_service = get_document_index_service(request)
    parser_service = getattr(index_service, "parser_service", None)
    if parser_service is None:
        raise HTTPException(status_code=500, detail="Service de parsing document non disponible.")

    temp_path: Path | None = None
    try:
        with NamedTemporaryFile(delete=False, suffix=".docx") as temp_file:
            temp_file.write(content)
            temp_path = Path(temp_file.name)

        text = parser_service.parse_document(str(temp_path), ".docx")
        normalized_text = text.strip()
        return ok_response(
            message="Apercu texte genere avec succes.",
            data={
                "content": normalized_text,
                "wordCount": len(normalized_text.split()) if normalized_text else 0,
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Impossible de lire le contenu du document Word: {exc}") from exc
    finally:
        if temp_path is not None and temp_path.exists():
            temp_path.unlink(missing_ok=True)


@router.get("/{document_id}/file")
async def get_document_file(request: Request, document_id: str):
    service = get_document_index_service(request)

    file_path, media_type = service.get_document_file_response_data(document_id)
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=file_path.name,
        headers={"Content-Disposition": f'inline; filename="{file_path.name}"'},
    )


@router.get("/{document_id}/preview", response_model=DocumentPreviewOut)
async def get_document_preview(request: Request, document_id: str):
    service = get_document_index_service(request)

    return service.get_document_preview(document_id)


@router.delete("/{document_id}/index", response_model=DocumentActionResponse)
async def delete_document_from_index(request: Request, document_id: str):
    service = get_document_index_service(request)

    audit_service = get_optional_audit_service(request)
    current_user = get_current_user(request)

    document_before = service.document_repository.get_by_id(document_id)
    old_legal_status = (
        service.legal_status_service.resolve_status(document_before)
        if document_before is not None
        else ""
    )

    result = service.delete_document_from_index(document_id)

    if audit_service:
        doc = result.data
        doc_title = getattr(doc, "title", None) or document_id
        doc_category = getattr(doc, "category", None) or ""
        new_legal_status = getattr(doc, "legalStatus", None) or "abroge"
        deleted_at = getattr(doc, "deletedAt", None)
        try_log_audit(
            request,
            "log_document_action",
            current_user=current_user,
            action_type="DOCUMENT_DELETED_LOGICALLY",
            action_label="Suppression document",
            category="Gestion document",
            entity_type="DOCUMENT",
            entity_id=document_id,
            entity_label=doc_title,
            summary=f"Document \"{doc_title}\" supprime et marque comme abroge.",
            metadata={
                "documentId": document_id,
                "titre": doc_title,
                "categorie": doc_category,
                "ancienStatut": old_legal_status,
                "nouveauStatut": str(new_legal_status),
                "deletedAt": deleted_at.isoformat() if deleted_at else None,
                "resultat": "success",
            },
        )

    return result


@router.post("/{document_id}/reindex", response_model=DocumentActionResponse)
async def reindex_document(request: Request, document_id: str):
    service = get_document_index_service(request)

    audit_service = get_optional_audit_service(request)
    current_user = get_current_user(request)

    try:
        result = service.reindex_document(document_id)
    except HTTPException as exc:
        if audit_service and exc.status_code == 500:
            try_log_audit(
                request,
                "log_document_action",
                current_user=current_user,
                action_type="DOCUMENT_REINDEXED",
                action_label="Reindexation document",
                category="Gestion document",
                entity_type="DOCUMENT",
                entity_id=document_id,
                entity_label=document_id,
                summary=f"Echec de reindexation du document ({document_id}).",
                metadata={
                    "documentId": document_id,
                    "erreur": str(exc.detail)[:300],
                    "resultat": "failed",
                },
            )
        raise

    if audit_service:
        doc = result.data
        doc_title = getattr(doc, "title", None) or document_id
        doc_status = getattr(doc, "status", None) or "indexed"
        chunks_count = getattr(doc, "chunk_count", None) or 0
        try_log_audit(
            request,
            "log_document_action",
            current_user=current_user,
            action_type="DOCUMENT_REINDEXED",
            action_label="Reindexation document",
            category="Gestion document",
            entity_type="DOCUMENT",
            entity_id=document_id,
            entity_label=doc_title,
            summary=f"Document \"{doc_title}\" reindexe avec succes.",
            metadata={
                "documentId": document_id,
                "titre": doc_title,
                "nouveauStatut": doc_status,
                "chunkCount": chunks_count,
                "resultat": "success",
            },
        )

    return result


@router.post("/index")
async def index_document(
    request: Request,
    file: Annotated[UploadFile, File(...)],
    category: Annotated[str, Form(...)],
    title: Annotated[str, Form(...)],
    realized_at: Annotated[str | None, Form()] = None,
    legal_status: Annotated[str | None, Form()] = None,
    document_type: Annotated[str | None, Form()] = None,
    date_publication: Annotated[str | None, Form()] = None,
    date_entree_vigueur: Annotated[str | None, Form()] = None,
    version: Annotated[str | None, Form()] = None,
    relation_type: Annotated[str | None, Form()] = None,
    related_document_id: Annotated[str | None, Form()] = None,
):
    validate_document_filename(file)
    validate_document_category(category)
    parsed_realized_at, parsed_date_publication, parsed_date_entree_vigueur = validate_document_dates(
        realized_at,
        date_publication,
        date_entree_vigueur,
    )
    validate_document_type(document_type)
    validate_relation_type(relation_type)

    service = get_document_index_service(request)

    audit_service = get_optional_audit_service(request)
    current_user = get_current_user(request)
    file_name = file.filename or ""
    file_size = validate_document_size(file)
    normalized_title = normalize_required_title(title)

    try:
        result = await service.import_and_index(
            file=file,
            category=category,
            title=normalized_title,
            realized_at=parsed_realized_at,
            legal_status=None,
            document_type=document_type,
            date_publication=parsed_date_publication,
            date_entree_vigueur=parsed_date_entree_vigueur,
            version=version,
            relation_type=relation_type,
            related_document_id=related_document_id,
        )
        if audit_service:
            doc = (result.get("document") or {}) if isinstance(result, dict) else {}
            doc_id = str(doc.get("id", "") or doc.get("_id", ""))
            try_log_audit(
                request,
                "log_document_action",
                current_user=current_user,
                action_type="DOCUMENT_IMPORTED",
                action_label="Import document",
                category="Gestion document",
                entity_type="DOCUMENT",
                entity_id=doc_id,
                entity_label=title,
                summary=f"Document \"{title}\" importe et indexe avec succes.",
                metadata={
                    "titre": title,
                    "categorie": category,
                    "typeDocument": document_type or "",
                    "nomFichier": file_name,
                    "tailleFichier": file_size,
                    "chunkCount": result.get("chunks_count", 0) if isinstance(result, dict) else 0,
                    "statut": "indexed",
                },
            )
        return ok_response(message="Document indexe avec succes.", data=result)
    except HTTPException:
        raise
    except Exception as exc:
        if audit_service:
            try_log_audit(
                request,
                "log_document_action",
                current_user=current_user,
                action_type="DOCUMENT_INDEXATION_FAILED",
                action_label="Echec indexation",
                category="Gestion document",
                entity_type="DOCUMENT",
                entity_id="",
                entity_label=title,
                summary=f"Echec lors de l indexation du document \"{title}\".",
                metadata={
                    "titre": title,
                    "categorie": category,
                    "nomFichier": file_name,
                    "erreur": str(exc)[:300],
                    "statut": "failed",
                },
            )
        raise internal_server_error(exc, "Document indexing") from exc
