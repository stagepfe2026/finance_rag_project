from __future__ import annotations

from typing import Any

from app.repositories import AuditEventRepository


class AuditLoggerService:
    # Initialise le service avec le repository d'evenements d'audit.
    def __init__(self, audit_event_repository: AuditEventRepository) -> None:
        self.audit_event_repository = audit_event_repository

    # Enregistre une action sur un document dans le journal d'audit.
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
            action_type=action_type,
            action_label=action_label,
            category=category,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_label=entity_label,
            summary=summary,
            metadata=metadata,
        )

    # Enregistre une tentative de connexion echouee dans le journal d'audit.
    def log_failed_login(self, *, email: str, reason: str = "INVALID_CREDENTIALS") -> None:
        normalized_email = email.strip().lower()
        self.audit_event_repository.log_event(
            user_id="",
            action_type="USER_LOGIN_FAILED",
            action_label="Connexion echouee",
            category="Authentification",
            entity_type="AUTH",
            entity_id=normalized_email,
            entity_label="Tentative de connexion",
            summary=f"Tentative de connexion echouee pour {normalized_email or 'un email vide'}.",
            metadata={"raison": reason, "email": normalized_email},
        )

    # Extrait l'ID et le nom complet d'un utilisateur depuis son dictionnaire.
    def _extract_user_fields(self, current_user: dict[str, Any]) -> tuple[str, str]:
        prenom = str(current_user.get("prenom", "")).strip()
        nom = str(current_user.get("nom", "")).strip()
        full_name = " ".join(part for part in [prenom, nom] if part).strip()
        user_id = str(current_user.get("id", ""))
        email = str(current_user.get("email", ""))
        return user_id, full_name or email or "Utilisateur"

    # Enregistre une connexion reussie dans le journal d'audit.
    def log_login_success(self, *, current_user: dict[str, Any]) -> None:
        user_id, user_name = self._extract_user_fields(current_user)
        self.audit_event_repository.log_event(
            user_id=user_id,
            action_type="USER_LOGIN",
            action_label="Connexion",
            category="Authentification",
            entity_type="AUTH",
            entity_id=user_id,
            entity_label="Session LOCAL",
            summary=f"{user_name} s'est connecte a la plateforme.",
            metadata={"methode": "local"},
        )

    # Enregistre une deconnexion utilisateur dans le journal d'audit.
    def log_logout(self, *, current_user: dict[str, Any]) -> None:
        user_id, user_name = self._extract_user_fields(current_user)
        self.audit_event_repository.log_event(
            user_id=user_id,
            action_type="USER_LOGOUT",
            action_label="Deconnexion",
            category="Authentification",
            entity_type="AUTH",
            entity_id=user_id,
            entity_label="Session LOCAL",
            summary=f"{user_name} a termine sa session.",
            metadata={},
        )

    # Enregistre l'envoi d'un message chat dans le journal d'audit.
    def log_chat_message(self, *, current_user: dict[str, Any], content: str, conversation_id: str) -> None:
        user_id, user_name = self._extract_user_fields(current_user)
        label = (content[:80] + "...") if len(content) > 80 else content
        self.audit_event_repository.log_event(
            user_id=user_id,
            action_type="CHAT_MESSAGE",
            action_label="Message envoye",
            category="Chat",
            entity_type="CONVERSATION",
            entity_id=conversation_id or "",
            entity_label=label,
            summary=f"{user_name} a envoye un message.",
            metadata={"conversationId": conversation_id or ""},
        )

    # Enregistre une action sur une reclamation dans le journal d'audit.
    def log_reclamation_action(
        self,
        *,
        current_user: dict[str, Any],
        action_type: str,
        action_label: str,
        reclamation_id: str,
        subject: str,
    ) -> None:
        user_id, user_name = self._extract_user_fields(current_user)
        self.audit_event_repository.log_event(
            user_id=user_id,
            action_type=action_type,
            action_label=action_label,
            category="Reclamations",
            entity_type="RECLAMATION",
            entity_id=reclamation_id,
            entity_label=subject,
            summary=f"{user_name} — {action_label} : {subject}.",
            metadata={"reclamationId": reclamation_id},
        )

    # Enregistre un evenement systeme interne dans le journal d'audit.
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
            action_type=action_type,
            action_label=action_label,
            category=category,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_label=entity_label,
            summary=summary,
            metadata=metadata,
        )
