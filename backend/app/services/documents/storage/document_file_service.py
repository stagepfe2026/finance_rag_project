from pathlib import Path
from uuid import uuid4

from app.core.config import settings
from app.repositories.document_repository import DocumentRepository
from fastapi import HTTPException


class DocumentFileService:
    def __init__(self, document_repository: DocumentRepository) -> None:
        self.document_repository = document_repository
        self.storage_dir = Path(settings.documents_storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.backend_dir = Path(__file__).resolve().parents[4]
        self.project_root = Path(__file__).resolve().parents[5]

    def store_uploaded_file(self, original_name: str, extension: str, content: bytes) -> Path:
        safe_stem = Path(original_name).stem or "document"
        normalized_stem = "".join(
            char if char.isalnum() or char in {"-", "_"} else "-" for char in safe_stem
        )
        normalized_stem = normalized_stem.strip("-_") or "document"
        target_name = f"{normalized_stem}-{uuid4().hex}{extension}"
        target_path = self.storage_dir / target_name
        target_path.write_bytes(content)
        return target_path

    def resolve_existing_file_path(self, stored_file_path: str) -> Path | None:
        normalized_value = (stored_file_path or "").strip()
        if not normalized_value:
            return None

        normalized_path = Path(normalized_value.replace("\\", "/"))
        candidate_paths: list[Path] = []

        if normalized_path.is_absolute():
            candidate_paths.append(normalized_path)
        else:
            candidate_paths.extend(
                [
                    normalized_path,
                    self.backend_dir / normalized_path,
                    self.project_root / normalized_path,
                ]
            )

        storage_candidates = [
            self.storage_dir,
            self.backend_dir / settings.documents_storage_dir,
            self.project_root / settings.documents_storage_dir,
            self.backend_dir / "storage" / "documents",
        ]

        file_name = normalized_path.name
        if file_name:
            candidate_paths.extend(base / file_name for base in storage_candidates)

        seen: set[str] = set()
        for candidate in candidate_paths:
            resolved = candidate.expanduser()
            key = str(resolved)
            if key in seen:
                continue
            seen.add(key)

            if resolved.exists() and resolved.is_file():
                return resolved

        return None

    def get_file_response_data(self, document_id: str) -> tuple[Path, str]:
        document = self.document_repository.get_by_id(document_id)
        if document is None or document.deleted_at is not None:
            raise HTTPException(status_code=404, detail="Document introuvable.")

        file_path = self.resolve_existing_file_path(document.file_path)
        if file_path is None:
            raise HTTPException(
                status_code=404,
                detail="Fichier du document introuvable. Les anciens documents indexes avant cette mise a jour peuvent ne pas etre consultables.",
            )

        return file_path, document.file_type
