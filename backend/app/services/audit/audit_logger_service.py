from __future__ import annotations

from typing import Any

from app.repositories import AuditEventRepository


class AuditLoggerService:
    def __init__(self, audit_event_repository: AuditEventRepository) -> None:
        self.audit_event_repository = audit_event_repository

    def log_document_action(
        self,
        *,
        current_user: dict[str, Any],
        action_type: str,
        action_label: str,
        entity_type: str,
        entity_id: str,
        entity_label: str,
        summary: str,
        category: str = "Recherche document",
        metadata: dict[str, Any] | None = None,
    ) -> None:
        full_name = " ".join(
            part.strip()
            for part in [str(current_user.get("prenom", "")), str(current_user.get("nom", ""))]
            if part and part.strip()
        ).strip()
        self.audit_event_repository.log_event(
            user_id=str(current_user.get("id", "")),
            user_name=full_name or str(current_user.get("email", "")) or "Utilisateur",
            user_email=str(current_user.get("email", "")),
            user_role=str(current_user.get("role", "")),
            action_type=action_type,
            action_label=action_label,
            category=category,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_label=entity_label,
            summary=summary,
            metadata=metadata,
        )

    def log_failed_login(self, *, email: str, reason: str = "INVALID_CREDENTIALS") -> None:
        normalized_email = email.strip().lower()
        self.audit_event_repository.log_event(
            user_id="",
            user_name=normalized_email or "Utilisateur inconnu",
            user_email=normalized_email,
            user_role="",
            action_type="USER_LOGIN_FAILED",
            action_label="Connexion echouee",
            category="Authentification",
            entity_type="AUTH",
            entity_id=normalized_email,
            entity_label="Tentative de connexion",
            summary=f"Tentative de connexion echouee pour {normalized_email or 'un email vide'}.",
            metadata={"raison": reason},
        )

    def log_system_event(
        self,
        *,
        action_type: str,
        action_label: str,
        category: str,
        entity_type: str,
        entity_id: str,
        entity_label: str,
        summary: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.audit_event_repository.log_event(
            user_id="system",
            user_name="Systeme",
            user_email="",
            user_role="",
            action_type=action_type,
            action_label=action_label,
            category=category,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_label=entity_label,
            summary=summary,
            metadata=metadata,
        )
