from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse

from app.api.dependencies.auth_dependencies import require_admin_user
from app.schemas import (
    DocumentActionResponse,
    DocumentCategory,
    DocumentListResponse,
    DocumentPreviewOut,
    DocumentStatus,
    LegalDocumentType,
    LegalRelationType,
)

router = APIRouter(dependencies=[Depends(require_admin_user)])

MAX_DOCUMENT_UPLOAD_SIZE = 20 * 1024 * 1024


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    request: Request,
    search: Annotated[str | None, Query()] = None,
    category: Annotated[DocumentCategory | None, Query()] = None,
    status: Annotated[DocumentStatus | None, Query()] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(
            status_code=500,
            detail="Service d indexation de document non disponible.",
        )

    try:
        current_user = getattr(request.state, "current_user", None) or {}
        audit_service = getattr(request.app.state, "audit_service", None)
        service.activate_due_future_documents(audit_service=audit_service)
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
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{document_id}/file")
async def get_document_file(request: Request, document_id: str):
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
        headers={"Content-Disposition": f'inline; filename="{file_path.name}"'},
    )


@router.get("/{document_id}/preview", response_model=DocumentPreviewOut)
async def get_document_preview(request: Request, document_id: str):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(
            status_code=500,
            detail="Service d indexation de document non disponible.",
        )

    return service.get_document_preview(document_id)


@router.delete("/{document_id}/index", response_model=DocumentActionResponse)
async def delete_document_from_index(request: Request, document_id: str):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(
            status_code=500,
            detail="Service d indexation de document non disponible.",
        )

    audit_service = getattr(request.app.state, "audit_service", None)
    current_user = getattr(request.state, "current_user", None) or {}

    document_before = service.document_repository.get_by_id(document_id)
    old_legal_status = (
        service.legal_status_service.compute_effective_legal_status(document_before)
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
        try:
            audit_service.record_document_activity(
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
        except Exception:
            pass

    return result


@router.post("/{document_id}/reindex", response_model=DocumentActionResponse)
async def reindex_document(request: Request, document_id: str):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(
            status_code=500,
            detail="Service d indexation de document non disponible.",
        )

    audit_service = getattr(request.app.state, "audit_service", None)
    current_user = getattr(request.state, "current_user", None) or {}

    try:
        result = service.reindex_document(document_id)
    except HTTPException as exc:
        if audit_service and exc.status_code == 500:
            try:
                audit_service.record_document_activity(
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
            except Exception:
                pass
        raise

    if audit_service:
        doc = result.data
        doc_title = getattr(doc, "title", None) or document_id
        doc_status = getattr(doc, "status", None) or "indexed"
        chunks_count = getattr(doc, "chunks_count", None) or 0
        try:
            audit_service.record_document_activity(
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
                    "chunksCount": chunks_count,
                    "resultat": "success",
                },
            )
        except Exception:
            pass

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
    allowed_types = [".pdf", ".docx"]

    if not file.filename:
        raise HTTPException(status_code=400, detail="Nom de fichier invalide.")

    if not any(file.filename.lower().endswith(ext) for ext in allowed_types):
        raise HTTPException(
            status_code=400,
            detail="Seuls les fichiers PDF et DOCX sont supportes.",
        )

    allowed_categories = {item.name for item in DocumentCategory}
    if category not in allowed_categories:
        raise HTTPException(
            status_code=400,
            detail=f"category doit etre une des valeurs suivantes: {', '.join(sorted(item.name for item in DocumentCategory))}.",
        )

    parsed_realized_at = None
    parsed_date_publication = None
    parsed_date_entree_vigueur = None
    if realized_at:
        try:
            parsed_realized_at = datetime.fromisoformat(realized_at)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail="realized_at doit etre une date ISO 8601 valide.",
            ) from exc

    if date_publication:
        try:
            parsed_date_publication = datetime.fromisoformat(date_publication)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail="date_publication doit etre une date ISO 8601 valide.",
            ) from exc
        if parsed_date_publication.date() > datetime.now(UTC).date():
            raise HTTPException(
                status_code=400,
                detail="La date de publication ne peut pas etre future.",
            )

    if date_entree_vigueur:
        try:
            parsed_date_entree_vigueur = datetime.fromisoformat(date_entree_vigueur)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail="date_entree_vigueur doit etre une date ISO 8601 valide.",
            ) from exc
    else:
        raise HTTPException(
            status_code=400,
            detail="La date d entree en vigueur est obligatoire.",
        )

    if parsed_date_publication and parsed_date_entree_vigueur.date() < parsed_date_publication.date():
        raise HTTPException(
            status_code=400,
            detail="La date d entree en vigueur doit etre posterieure ou egale a la date de publication.",
        )

    if document_type and document_type not in {item.value for item in LegalDocumentType}:
        raise HTTPException(
            status_code=400,
            detail="document_type doit etre une valeur valide.",
        )
    if not document_type or document_type == LegalDocumentType.autre.value:
        raise HTTPException(
            status_code=400,
            detail="Le type de document est obligatoire.",
        )

    if relation_type and relation_type not in {item.value for item in LegalRelationType}:
        raise HTTPException(
            status_code=400,
            detail="relation_type doit etre une valeur valide.",
        )

    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(
            status_code=500,
            detail="Service d indexation de document non disponible.",
        )

    audit_service = getattr(request.app.state, "audit_service", None)
    current_user = getattr(request.state, "current_user", None) or {}
    file_name = file.filename or ""
    file_size = getattr(file, "size", None) or 0
    if file_size and file_size > MAX_DOCUMENT_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Le fichier depasse la taille maximale autorisee.",
        )

    normalized_title = " ".join(title.split()).strip()
    if not normalized_title:
        raise HTTPException(status_code=400, detail="Le titre est obligatoire.")

    try:
        result = await service.index_document(
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
            try:
                audit_service.record_document_activity(
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
                        "chunksCount": result.get("chunks_count", 0) if isinstance(result, dict) else 0,
                        "statut": "indexed",
                    },
                )
            except Exception:
                pass
        return {
            "success": True,
            "message": "Document indexe avec succes.",
            "data": result,
        }
    except HTTPException:
        raise
    except Exception as exc:
        if audit_service:
            try:
                audit_service.record_document_activity(
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
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=str(exc)) from exc
