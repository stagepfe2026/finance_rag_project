import os
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.infrastructure.nlp.nlp_provider import FrenchNlpProvider
from app.models.document_model import DocumentModel
from app.repositories.document_repository import DocumentRepository
from app.repositories.qdrant_repository import QdrantRepository
from app.schemas import (
    DocumentActionResponse,
    DocumentListResponse,
    DocumentPreviewOut,
    DocumentSearchResponse,
    LegalStatus,
)
from app.services.documents.indexing.document_parser_service import DocumentParserService
from app.services.documents.indexing.document_pipeline_service import DocumentPipelineService
from app.services.documents.legal.document_relation_service import DocumentRelationService
from app.services.documents.legal.legal_metadata_service import LegalMetadataService
from app.services.documents.legal.legal_status_service import LegalStatusService
from app.services.documents.search.document_search_service import DocumentSearchService
from app.services.documents.storage.document_file_service import DocumentFileService
from app.services.notifications.notification_service import NotificationService
from app.services.rag.processing.embedding_service import EmbeddingService
from app.services.rag.processing.nlp_service import NLPService
from fastapi import HTTPException, UploadFile


class DocumentIndexService:
    MAX_UPLOAD_SIZE = 20 * 1024 * 1024

    # Initialise le service d'indexation avec tous les sous-services et repositories.
    def __init__(
        self,
        embedding_service: EmbeddingService,
        notification_service: NotificationService | None = None,
    ):
        self.parser_service = DocumentParserService()
        self.nlp_service = NLPService(FrenchNlpProvider())
        self.embedding_service = embedding_service
        self.notification_service = notification_service
        self.qdrant_repository = QdrantRepository()
        self.document_repository = DocumentRepository()
        self.legal_metadata_service = LegalMetadataService(self.document_repository)
        self.legal_status_service = LegalStatusService(self.document_repository)
        self.document_relation_service = DocumentRelationService(self.document_repository)
        self.storage_dir = Path(settings.documents_storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.backend_dir = Path(__file__).resolve().parents[4]
        self.project_root = Path(__file__).resolve().parents[5]
        self.file_service = DocumentFileService(self.document_repository)
        self.pipeline_service = DocumentPipelineService(
            document_parser_service=self.parser_service,
            nlp_service=self.nlp_service,
            embedding_service=self.embedding_service,
            qdrant_repository=self.qdrant_repository,
            document_repository=self.document_repository,
            legal_status_service=self.legal_status_service,
        )
        # Instancie le service de recherche et de liste de documents.
        self.search_service = DocumentSearchService(
            document_repository=self.document_repository,
            legal_status_service=self.legal_status_service,
        )

    # Valide, stocke et indexe un document uploade dans Qdrant et MongoDB.
    async def import_and_index(
        self,
        file: UploadFile,
        category: str,
        title: str,
        realized_at: datetime | None = None,
        legal_status: str | None = None,
        document_type: str | None = None,
        date_publication: datetime | None = None,
        date_entree_vigueur: datetime | None = None,
        relation_type: str | None = None,
        related_document_id: str | None = None,
        admin_id: str | None = None,
    ) -> dict:
        #Lit le fichier et verifie sa taille (max 20 Mo).
        extension = os.path.splitext(file.filename or "")[1].lower()
        content = await file.read()
        if len(content) > self.MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=400, detail="Le fichier depasse la taille maximale autorisee.")

        # Construit les metadonnees juridiques (statut, type, dates, relation).
        effective_date_publication = date_publication or datetime.now(UTC)
        prepared_legal_metadata = self.legal_metadata_service.build_legal_metadata(
            legal_status=None,
            document_type=document_type,
            date_publication=effective_date_publication,
            date_entree_vigueur=date_entree_vigueur,
            relation_type=relation_type,
            related_document_id=related_document_id,
        )

        #  Verifie que le document cible d'un remplacement est valide.
        # Meme regle que le frontend: un document ne peut remplacer qu'un document
        # de meme categorie et de meme type juridique.
        self._validate_replacement_target(
            relation_type=str(prepared_legal_metadata["relation_type"]),
            related_document_id=prepared_legal_metadata["related_document_id"],
            category=category,
            document_type=str(prepared_legal_metadata["document_type"]),
        )

        # Verifie qu'il n'existe pas deja (titre + categorie + type).
        if self.document_repository.already_exists(
            title=title,
            category=category,
            legal_type=str(prepared_legal_metadata["document_type"]),
        ):
            raise HTTPException(
                status_code=409,
                detail="Un document avec le meme titre, categorie et type existe deja.",
            )

        #Stocke le fichier physique sur le disque.
        stored_file_path = self.file_service.store_uploaded_file(
            file.filename or "document", extension, content
        )

        # Cree l'entree MongoDB en statut "processing".
        document = DocumentModel.new_processing(
            title=title,
            category=category,
            legal_status=str(prepared_legal_metadata["legal_status"]),
            legal_type=str(prepared_legal_metadata["document_type"]),
            issued_at=realized_at,
            date_publication=prepared_legal_metadata["date_publication"],
            date_entree_vigueur=prepared_legal_metadata["date_entree_vigueur"],
            relation_to_target=str(prepared_legal_metadata["relation_type"]),
            target_document_id=prepared_legal_metadata["related_document_id"],
            file_path=str(stored_file_path),
            file_size=len(content),
            file_type=file.content_type or "application/octet-stream",
        )
        document = self.document_repository.save(document)

        try:
            # Parse, chunke, embed et upsert dans Qdrant.
            cleaned_text, chunks = self.pipeline_service.parse_and_chunk(str(stored_file_path), extension)
            related_document_title = self._resolve_related_document_title(document.target_document_id)
            effective_legal_status = self.legal_status_service.resolve_status(document)
            inserted_count = self.pipeline_service.embed_and_upsert(
                category=category,
                document_id=document.id or "",
                document_title=document.title,
                document_name=file.filename or title,
                legal_type=document.legal_type,
                legal_status=effective_legal_status,
                date_publication=document.date_publication.isoformat() if document.date_publication else None,
                date_entree_vigueur=(
                    document.date_entree_vigueur.isoformat() if document.date_entree_vigueur else None
                ),
                relation_to_target=document.relation_to_target,
                target_document_id=document.target_document_id,
                related_document_title=related_document_title,
                issued_at=document.issued_at.isoformat() if document.issued_at else None,
                chunks=chunks,
            )

            #Marque le document comme indexe dans MongoDB.
            stored_document = self.document_repository.set_as_indexed(
                document.id,
                chunk_count=len(chunks),
                extracted_text=cleaned_text,
                indexed_by_admin_id=admin_id,
            )

            if stored_document is not None:
                # Applique la succession juridique (remplace/abroge le document lie).
                self.document_relation_service.apply_legal_succession(stored_document)

                # Envoie des notifications WebSocket.
                if self.notification_service is not None:
                    await self.notification_service.alert_document_ready(stored_document)
                    # Notifie les utilisateurs qui ont mis en favori le document remplace/abroge.
                    if related_document_id and relation_type in ("remplace", "abroge"):
                        deprecated = self.document_repository.get_by_id(related_document_id)
                        if deprecated is not None:
                            await self.notification_service.notify_document_deprecated_for_favorites(
                                deprecated, stored_document.title
                            )

            return {
                "document": (
                    self._with_effective_legal_status(stored_document).to_out_schema().model_dump()
                    if stored_document
                    else None
                ),
                "document_name": file.filename,
                "category": category,
                "document_type": extension.replace(".", ""),
                "chunks_count": len(chunks),
                "indexed_points": inserted_count,
            }
        except Exception as exc:
            # En cas d'echec, marque le document comme echoue et notifie l'admin.
            self.document_repository.set_as_failed(document.id, str(exc))
            if self.notification_service is not None:
                try:
                    await self.notification_service.notify_indexation_failed(title, str(exc)[:200])
                except Exception:
                    pass
            raise

    # Verifie que le document cible d'un remplacement est valide (meme categorie et type).
    def _validate_replacement_target(
        self,
        *,
        relation_type: str,
        related_document_id: str | None,
        category: str,
        document_type: str,
    ) -> None:
        # Si ce n'est pas une relation de remplacement, aucune validation n'est necessaire.
        if relation_type != "remplace":
            return

        # Validation serveur indispensable: elle protege l'API meme si le formulaire
        # Verifie qu'un document cible est bien specifie.
        if not related_document_id:
            raise HTTPException(status_code=400, detail="Selectionnez le document a remplacer.")

        # Verifie que le document cible existe et n'est pas supprime.
        target_document = self.document_repository.get_by_id(related_document_id)
        if target_document is None or target_document.deleted_at is not None:
            raise HTTPException(status_code=404, detail="Le document a remplacer est introuvable.")

        # Verifie que le document cible appartient a la meme categorie.
        if target_document.category != category:
            raise HTTPException(
                status_code=400,
                detail="Le document remplace doit appartenir a la meme categorie.",
            )

        # Verifie que le document cible a le meme type juridique.
        if target_document.legal_type != document_type:
            raise HTTPException(
                status_code=400,
                detail="Le document remplace doit avoir le meme type juridique.",
            )

    # Delegue la liste paginee des documents au DocumentSearchService.
    def list_documents(
        self,
        *,
        search: str | None = None,
        category: str | None = None,
        status: str | None = None,
        current_user_id: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> DocumentListResponse:
        # Transmet tous les filtres au service de recherche et retourne le resultat pagine.
        return self.search_service.list_documents(
            search=search,
            category=category,
            status=status,
            current_user_id=current_user_id,
            skip=skip,
            limit=limit,
        )

    # Active automatiquement les documents dont la date d'entree en vigueur est echeue.
    def publish_scheduled_documents(self, audit_service: Any | None = None) -> int:
        # Recupere tous les documents dont la date d'entree en vigueur est passee.
        due_documents = self.document_repository.pending_activation(now=datetime.now(UTC))
        updated_count = 0

        for document in due_documents:
            if not document.id:
                continue

            # Sauvegarde l'ancien statut pour l'audit avant mise a jour.
            previous_status = document.legal_status
            # Passe le document en statut "actif" dans MongoDB.
            updated_document = self.document_repository.update_metadata(
                document.id,
                legal_status="actif",
            )
            if updated_document is None:
                continue
            updated_count += 1
            # Recupere l'etat du document lie avant application de la succession.
            related_before = (
                self.document_repository.get_by_id(updated_document.target_document_id)
                if updated_document.target_document_id
                else None
            )

            # Applique la succession juridique (marque le document remplace/abroge).
            self.document_relation_service.apply_legal_succession(updated_document)

            if audit_service is not None:
                # Trace le changement de statut du document active dans l'audit.
                try:
                    audit_service.log_system_event(
                        action_type="LEGAL_STATUS_AUTO_UPDATED",
                        action_label="Statut juridique automatique",
                        category="Gestion document",
                        entity_type="DOCUMENT",
                        entity_id=document.id,
                        entity_label=document.title,
                        summary=f"Statut juridique du document \"{document.title}\" mis a jour automatiquement.",
                        metadata={
                            "documentId": document.id,
                            "ancienStatut": previous_status,
                            "nouveauStatut": "actif",
                            "dateEntreeVigueur": document.date_entree_vigueur.isoformat()
                            if document.date_entree_vigueur
                            else None,
                            "raison": "activation automatique",
                        },
                    )
                except Exception:
                    pass

                # Trace aussi le changement de statut du document lie si son statut a change.
                if related_before is not None and related_before.id:
                    related_after = self.document_repository.get_by_id(related_before.id)
                    if related_after is not None and related_after.legal_status != related_before.legal_status:
                        try:
                            audit_service.log_system_event(
                                action_type="LEGAL_STATUS_AUTO_UPDATED",
                                action_label="Statut juridique automatique",
                                category="Gestion document",
                                entity_type="DOCUMENT",
                                entity_id=related_before.id,
                                entity_label=related_before.title,
                                summary=(
                                    f"Statut juridique du document \"{related_before.title}\" mis a jour "
                                    f"par relation juridique."
                                ),
                                metadata={
                                    "documentId": related_before.id,
                                    "ancienStatut": related_before.legal_status,
                                    "nouveauStatut": related_after.legal_status,
                                    "dateEntreeVigueur": updated_document.date_entree_vigueur.isoformat()
                                    if updated_document.date_entree_vigueur
                                    else None,
                                    "raison": "relation juridique",
                                    "sourceDocumentId": updated_document.id,
                                    "relationToTarget": updated_document.relation_to_target,
                                },
                            )
                        except Exception:
                            pass

        return updated_count

    # Delegue la recherche filtree de documents au DocumentSearchService.
    def search_documents(
        self,
        *,
        query: str | None = None,
        title: str | None = None,
        categories: list[str] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        favorites_only: bool = False,
        current_user_id: str | None = None,
        sort_by: str = "recent",
        skip: int = 0,
        limit: int = 100,
    ) -> DocumentSearchResponse:
        # Transmet tous les criteres de recherche au service dedie et retourne les resultats.
        return self.search_service.search_documents(
            query=query,
            title=title,
            categories=categories,
            date_from=date_from,
            date_to=date_to,
            favorites_only=favorites_only,
            current_user_id=current_user_id,
            sort_by=sort_by,
            skip=skip,
            limit=limit,
        )

    # Retourne le chemin et le type MIME du fichier physique d'un document.
    def get_document_file_response_data(self, document_id: str) -> tuple[Path, str]:
        # Delegue au service fichier qui resout le chemin et detecte le MIME type.
        return self.file_service.get_file_response_data(document_id)

    # Retourne le contenu textuel extrait d'un document pour la previsualisation.
    def get_document_preview(self, document_id: str) -> DocumentPreviewOut:
        # Recupere le document et leve une 404 s'il est introuvable.
        document = self._require_document(document_id)

        # Utilise le texte deja extrait si disponible en base.
        preview_content = (document.extracted_text or "").strip()

        if not preview_content:
            # Si le texte n'est pas en base, re-parse le fichier physique a la volee.
            file_path = self.file_service.resolve_existing_file_path(document.file_path)
            if file_path is None:
                raise HTTPException(status_code=404, detail="Contenu du document introuvable.")
            # Applique le preprocessing NLP apres parsing pour nettoyer le texte.
            preview_content = self.nlp_service.preprocess_document(
                self.parser_service.parse_document(str(file_path), file_path.suffix.lower())
            )

        if not preview_content:
            raise HTTPException(status_code=404, detail="Contenu du document introuvable.")

        # Injecte le texte extrait et retourne le schema de previsualisation.
        document.extracted_text = preview_content
        return self._with_effective_legal_status(document).to_preview_schema()

    # Delegue la gestion du favori d'un document au DocumentSearchService.
    def set_document_favorite(
        self,
        document_id: str,
        is_favorite: bool,
        *,
        current_user_id: str,
    ) -> DocumentActionResponse:
        # Ajoute ou retire le document des favoris de l'utilisateur courant.
        return self.search_service.set_document_favorite(
            document_id,
            is_favorite,
            current_user_id=current_user_id,
        )

    # Supprime un document de Qdrant et le marque comme supprime dans MongoDB.
    def delete_document_from_index(self, document_id: str, admin_id: str | None = None) -> DocumentActionResponse:
        # Recupere le document et verifie qu'il existe.
        document = self._require_document(document_id)

        # Verifie que le statut juridique autorise la suppression (actif ou remplace uniquement).
        effective_legal_status = self.legal_status_service.resolve_status(document)
        if effective_legal_status not in {LegalStatus.actif.value, LegalStatus.remplace.value}:
            raise HTTPException(status_code=400, detail="Ce document ne peut pas etre supprime.")

        # Supprime les vecteurs du document dans Qdrant.
        self.qdrant_repository.delete_by_document(document.category, document_id)

        # Marque le document comme supprime dans MongoDB (soft delete).
        updated_document = self.document_repository.remove(document_id, deleted_by_admin_id=admin_id)
        return DocumentActionResponse(
            message="Document supprime avec succes.",
            data=self._with_effective_legal_status(updated_document).to_out_schema()
            if updated_document
            else None,
        )

    # Reparse, rechunke et re-indexe un document existant dans Qdrant.
    def reindex_document(self, document_id: str, admin_id: str | None = None) -> DocumentActionResponse:
        # Recupere le document et verifie l'existence de son fichier physique.
        document = self._require_document(document_id)
        file_path = self.file_service.resolve_existing_file_path(document.file_path)
        if file_path is None:
            raise HTTPException(
                status_code=404, detail="Fichier du document introuvable pour la reindexation."
            )

        # Passe le document en statut "processing" avant de relancer le pipeline.
        self.document_repository.set_as_processing(document_id)

        try:
            # Parse et chunke le fichier physique.
            extension = file_path.suffix.lower()
            cleaned_text, chunks = self.pipeline_service.parse_and_chunk(str(file_path), extension)

            # Supprime les anciens vecteurs Qdrant avant d'upserter les nouveaux.
            self.qdrant_repository.delete_by_document(document.category, document_id)

            # Marque le document comme indexe dans MongoDB avec les nouvelles donnees.
            updated_document = self.document_repository.set_as_indexed(
                document_id,
                chunk_count=len(chunks),
                extracted_text=cleaned_text,
                indexed_by_admin_id=admin_id,
            )
            if updated_document is not None:
                related_document_title = self._resolve_related_document_title(updated_document.target_document_id)

                # Supprime une seconde fois pour eviter les doublons en cas de race condition.
                self.qdrant_repository.delete_by_document(updated_document.category, document_id)

                # Embed et upsert les nouveaux chunks dans Qdrant.
                self.pipeline_service.embed_and_upsert(
                    category=updated_document.category,
                    document_id=document_id,
                    document_title=updated_document.title,
                    document_name=file_path.name,
                    legal_type=updated_document.legal_type,
                    legal_status=self.legal_status_service.resolve_status(updated_document),
                    date_publication=(
                        updated_document.date_publication.isoformat()
                        if updated_document.date_publication
                        else None
                    ),
                    date_entree_vigueur=(
                        updated_document.date_entree_vigueur.isoformat()
                        if updated_document.date_entree_vigueur
                        else None
                    ),
                    relation_to_target=updated_document.relation_to_target,
                    target_document_id=updated_document.target_document_id,
                    related_document_title=related_document_title,
                    issued_at=updated_document.issued_at.isoformat() if updated_document.issued_at else None,
                    chunks=chunks,
                )
                # Reapplique la succession juridique apres reindexation.
                self.document_relation_service.apply_legal_succession(updated_document)

            return DocumentActionResponse(
                message="Document reindexe avec succes.",
                data=self._with_effective_legal_status(updated_document).to_out_schema()
                if updated_document
                else None,
            )
        except Exception as exc:
            # En cas d'echec, marque le document comme echoue dans MongoDB.
            self.document_repository.set_as_failed(document_id, str(exc))
            raise HTTPException(
                status_code=500,
                detail=str(exc),
            ) from exc

    # Recupere un document par son ID et leve une 404 s'il est introuvable ou supprime.
    def _require_document(self, document_id: str) -> DocumentModel:
        # Interroge MongoDB et verifie que le document existe et n'est pas supprime.
        document = self.document_repository.get_by_id(document_id)
        if document is None or document.deleted_at is not None:
            raise HTTPException(status_code=404, detail="Document introuvable.")
        return document

    # Calcule et injecte le statut juridique effectif dans un objet DocumentModel.
    def _with_effective_legal_status(self, document: DocumentModel) -> DocumentModel:
        # Resout le statut dynamiquement car le statut stocke peut etre perime (ex. futur -> actif).
        document.legal_status = self.legal_status_service.resolve_status(document)
        return document

    # Retourne le titre du document lie a partir de son ID, ou None s'il est introuvable.
    def _resolve_related_document_title(self, related_document_id: str | None) -> str | None:
        # Si aucun ID fourni, retourne None directement.
        if not related_document_id:
            return None

        # Recupere le document lie dans MongoDB et extrait son titre.
        related_document = self.document_repository.get_by_id(related_document_id)
        if related_document is None:
            return None
        return related_document.title
