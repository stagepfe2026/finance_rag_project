from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from app.core.config import settings
from app.core.security import (
    generate_csrf_token,
    generate_session_token,
    hash_session_token,
    verify_password,
)
from app.models import SessionModel, UserRole
from app.repositories import SessionsRepository, UsersRepository


class AuthService:
    # Initialise le service avec les repositories d'utilisateurs et de sessions.
    def __init__(self) -> None:
        self.users_repo = UsersRepository()
        self.sessions_repo = SessionsRepository()

    # Cree les index MongoDB necessaires aux repositories d'auth.
    def setup_indexes(self) -> None:
        self.users_repo.ensure_indexes()
        self.sessions_repo.ensure_indexes()

    # Authentifie un utilisateur et ouvre une nouvelle session.
    def sign_in(self, *, email: str, password: str) -> dict[str, Any]:
        user = self.users_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise ValueError("INVALID_CREDENTIALS")

        # Une seule session active par utilisateur: le nouveau login remplace les anciennes sessions.
        self.sessions_repo.close_all_for_user(user.id or "", reason="LOGIN_ROTATION")
        session_payload = self._create_session(user_id=user.id or "", auth_method="local")
        return {
            "user": user.to_public_dict(),
            "session_token": session_payload["session_token"],
            "csrf_token": session_payload["csrf_token"],
            "session": session_payload["session"],
            "redirect_to": self._get_home_path(user.role.value),
        }

    # Construit les informations de session pour l'endpoint /me.
    def build_session_info(self, *, current_user: dict | None, current_session: SessionModel | None) -> dict[str, Any]:
        if not current_user or not current_session:
            return {
                "authenticated": False,
                "user": None,
                "access_expires_at": None,
                "refresh_expires_at": None,
                "idle_expires_at": None,
                "absolute_expires_at": None,
            }

        return {
            "authenticated": True,
            "user": self._to_auth_user(current_user),
            "access_expires_at": current_session.access_expires_at.isoformat(),
            "refresh_expires_at": current_session.refresh_expires_at.isoformat(),
            "idle_expires_at": current_session.idle_expires_at.isoformat(),
            "absolute_expires_at": current_session.absolute_expires_at.isoformat(),
        }

    # Prolonge une session active en mettant a jour les dates d'expiration.
    def refresh_session(self, current_session: SessionModel) -> SessionModel:
        now = datetime.now(UTC)
        if current_session.refresh_expires_at <= now or current_session.absolute_expires_at <= now:
            self.sessions_repo.close(
                current_session.id or "",
                reason="REFRESH_TOKEN_EXPIRED",
                is_early_closure=False,
            )
            raise ValueError("REFRESH_EXPIRED")

        new_access_expiry = min(
            now + timedelta(minutes=settings.auth_access_token_minutes),
            current_session.refresh_expires_at,
            current_session.absolute_expires_at,
        )
        new_idle_expiry = min(
            now + timedelta(minutes=settings.auth_session_idle_minutes),
            current_session.absolute_expires_at,
        )
        self.sessions_repo.extend_activity(
            current_session.id or "",
            access_expires_at=new_access_expiry,
            idle_expires_at=new_idle_expiry,
        )
        current_session.access_expires_at = new_access_expiry
        current_session.idle_expires_at = new_idle_expiry
        current_session.last_activity_at = now
        return current_session

    # Ferme la session courante de l'utilisateur.
    async def logout(self, current_session: SessionModel | None) -> str | None:
        if not current_session:
            return None

        self.sessions_repo.close(
            current_session.id or "",
            reason="USER_LOGOUT",
            is_early_closure=True,
        )

        return None

    # Valide que le token CSRF du cookie correspond au token dans l'entete.
    def validate_csrf(self, *, cookie_token: str | None, header_token: str | None, current_session: SessionModel | None) -> bool:
        if not cookie_token or not header_token or not current_session:
            return False
        return cookie_token == header_token == current_session.csrf_token

    # Cree une nouvelle session avec tous les tokens et dates d'expiration.
    def _create_session(
        self,
        *,
        user_id: str,
        auth_method: str = "local",
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        absolute_expires_at = now + timedelta(hours=settings.auth_session_absolute_hours)
        refresh_expires_at = min(
            now + timedelta(hours=settings.auth_refresh_token_hours),
            absolute_expires_at,
        )
        access_expires_at = min(
            now + timedelta(minutes=settings.auth_access_token_minutes),
            refresh_expires_at,
        )
        idle_expires_at = min(
            now + timedelta(minutes=settings.auth_session_idle_minutes),
            absolute_expires_at,
        )

        session_token = generate_session_token()
        csrf_token = generate_csrf_token()
        session = SessionModel(
            user_id=user_id,
            hashed_token=hash_session_token(session_token),
            csrf_token=csrf_token,
            access_expires_at=access_expires_at,
            refresh_expires_at=refresh_expires_at,
            idle_expires_at=idle_expires_at,
            absolute_expires_at=absolute_expires_at,
            created_at=now,
            last_activity_at=now,
            auth_method=auth_method,
        )
        session_id = self.sessions_repo.open_session(session)
        session.id = session_id
        return {
            "session_token": session_token,
            "csrf_token": csrf_token,
            "session": session,
        }

    # Retourne le chemin d'accueil selon le role de l'utilisateur.
    @staticmethod
    def _get_home_path(role: str) -> str:
        return "/admin/dashboard" if role == UserRole.ADMIN.value else "/user/accueil"

    # Serialise un utilisateur en dictionnaire pour la reponse d'authentification.
    @staticmethod
    def _to_auth_user(user: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": str(user.get("id", "")),
            "nom": str(user.get("nom", "")),
            "prenom": str(user.get("prenom", "")),
            "email": str(user.get("email", "")),
            "role": str(user.get("role", "")),
            "telephone": str(user.get("telephone", "")),
            "avatarUrl": str(user.get("avatarUrl", "")),
            "adresse": str(user.get("adresse", "")),
            "birthDate": str(user.get("birthDate", "")),
            "direction": str(user.get("direction", "")),
            "service": str(user.get("service", "")),
            "poste": str(user.get("poste", "")),
            "matricule": str(user.get("matricule", "")),
            "bureau": str(user.get("bureau", "")),
            "manager": str(user.get("manager", "")),
            "memberSince": str(user.get("memberSince", "")),
            "preferredLanguage": str(user.get("preferredLanguage", "fr")),
            "preferredTheme": str(user.get("preferredTheme", "light")),
            "emailNotificationsOn": bool(user.get("emailNotificationsOn", True)),
            "smsNotificationsOn": bool(user.get("smsNotificationsOn", False)),
            "isTwoFactorEnabled": bool(user.get("isTwoFactorEnabled", False)),
            "passwordChangedAt": str(user.get("passwordChangedAt", "")),
        }
