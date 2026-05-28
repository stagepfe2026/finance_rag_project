import re
from pathlib import Path
from uuid import uuid4

from app.core.config import settings
from fastapi import UploadFile


class ReclamationAttachmentService:
    allowed_attachment_types = {
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg",
        ".doc",
        ".docx",
    }
    max_attachment_size = 5 * 1024 * 1024

    def __init__(self) -> None:
        self.storage_dir = Path(settings.reclamations_storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    async def store_attachment(self, attachment: UploadFile) -> dict:
        extension = Path(attachment.filename or "").suffix.lower()
        if extension not in self.allowed_attachment_types:
            raise ValueError("INVALID_ATTACHMENT_TYPE")

        content = await attachment.read()
        if len(content) > self.max_attachment_size:
            raise ValueError("ATTACHMENT_TOO_LARGE")

        safe_name = self._safe_stem(Path(attachment.filename or "piece-jointe").stem)
        target_path = self.storage_dir / f"{safe_name}-{uuid4().hex}{extension}"
        target_path.write_bytes(content)

        return {
            "name": attachment.filename,
            "path": str(target_path),
            "size": len(content),
            "content_type": attachment.content_type or "application/octet-stream",
        }

    def get_attachment_file_data(self, attachment_path: str | None, attachment_content_type: str | None) -> tuple[Path, str]:
        if not attachment_path:
            raise ValueError("ATTACHMENT_NOT_FOUND")

        file_path = Path(attachment_path)
        if not file_path.exists():
            raise ValueError("ATTACHMENT_NOT_FOUND")

        media_type = attachment_content_type or "application/octet-stream"
        return file_path, media_type

    def _safe_stem(self, value: str) -> str:
        cleaned = re.sub(r"[^A-Za-z0-9_-]+", "-", value).strip("-_")
        return cleaned or "piece-jointe"
