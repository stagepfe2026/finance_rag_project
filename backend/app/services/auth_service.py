from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import urlencode

import httpx
from app.core.config import settings
from app.core.security import (
    generate_csrf_token,
    generate_session_token,
    generate_state_token,
    hash_password,
    hash_session_token,
    verify_password,
)
from app.models import SessionModel, UserRole
from app.repositories import SessionsRepository, UsersRepository


class AuthService:
    def __init__(self) -> None:
        self.users_repo = UsersRepository()
        self.sessions_repo = SessionsRepository()
        self._oidc_metadata_cache: dict[str, Any] | None = None

    def ensure_auth_indexes(self) -> None:
        self.users_repo.ensure_indexes()
        self.sessions_repo.ensure_indexes()

    def seed_default_users(self) -> None:
        if not settings.auth_seed_default_users:
            return

        self.users_repo.upsert_user(
            nom="Admin",
            prenom="Systeme",
            email=settings.auth_default_admin_email,
            password_hash=hash_password(settings.auth_default_admin_password),
            role=UserRole.ADMIN.value,
        )
        self.users_repo.upsert_user(
            nom="Utilisateur",
            prenom="Finance",
            email=settings.auth_default_user_email,
            password_hash=hash_password(settings.auth_default_user_password),
            role=UserRole.FINANCE_USER.value,
        )

    def login_with_password(self, *, email: str, password: str) -> dict[str, Any]:
        user = self.users_repo.find_active_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise ValueError("INVALID_CREDENTIALS")

        self.sessions_repo.close_all_user_sessions(user.id or "", reason="LOGIN_ROTATION")
        session_payload = self._create_session(user_id=user.id or "", auth_method="local")
        return {
            "user": user.to_public_dict(),
            "session_token": session_payload["session_token"],
            "csrf_token": session_payload["csrf_token"],
            "session": session_payload["session"],
            "redirect_to": self._get_home_path(user.role.value),
        }

    async def start_oidc_login(self) -> dict[str, str]:
        metadata = await self._get_oidc_metadata()
        state = generate_state_token()
        params = {
            "client_id": settings.auth_oidc_client_id,
            "response_type": "code",
            "scope": settings.auth_oidc_scope,
            "redirect_uri": settings.auth_oidc_redirect_uri,
            "state": state,
        }
        return {
            "authorization_url": f"{metadata['authorization_endpoint']}?{urlencode(params)}",
            "state": state,
        }

    async def handle_oidc_callback(self, *, code: str) -> dict[str, Any]:
        metadata = await self._get_oidc_metadata()
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_response = await client.post(
                metadata["token_endpoint"],
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.auth_oidc_redirect_uri,
                    "client_id": settings.auth_oidc_client_id,
                    "client_secret": settings.auth_oidc_client_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            token_response.raise_for_status()
            token_data = token_response.json()

            userinfo_response = await client.get(
                metadata["userinfo_endpoint"],
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            userinfo_response.raise_for_status()
            claims = userinfo_response.json()

        role = self._extract_role_from_claims(claims)
        email = str(claims.get("email", "")).strip().lower()
        if not email:
            raise ValueError("OIDC_EMAIL_REQUIRED")

        user_id = self.users_repo.upsert_user(
            nom=str(claims.get("family_name", claims.get("name", "Utilisateur"))),
            prenom=str(claims.get("given_name", "OIDC")),
            email=email,
            password_hash=hash_password(generate_state_token()),
            role=role,
            profile_image_url=str(claims.get("picture", "")),
        )

        self.sessions_repo.close_all_user_sessions(user_id, reason="LOGIN_ROTATION")
        session_payload = self._create_session(
            user_id=user_id,
            auth_method="oidc",
            oidc_subject=str(claims.get("sub", "")) or None,
            oidc_access_token=token_data.get("access_token"),
            oidc_refresh_token=token_data.get("refresh_token"),
        )
        user = self.users_repo.find_active_by_id(user_id)
        return {
            "user": user.to_public_dict() if user else None,
            "session_token": session_payload["session_token"],
            "csrf_token": session_payload["csrf_token"],
            "session": session_payload["session"],
            "redirect_to": self._get_home_path(role),
        }

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

    def refresh_session(self, current_session: SessionModel) -> SessionModel:
        now = datetime.now(UTC)
        if current_session.refresh_expires_at <= now or current_session.absolute_expires_at <= now:
            self.sessions_repo.close_session(
                current_session.id or "",
                reason="REFRESH_TOKEN_EXPIRED",
                closed_before_expiry=False,
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
        self.sessions_repo.touch_activity(
            current_session.id or "",
            access_expires_at=new_access_expiry,
            idle_expires_at=new_idle_expiry,
        )
        current_session.access_expires_at = new_access_expiry
        current_session.idle_expires_at = new_idle_expiry
        current_session.last_activity_at = now
        return current_session

    def update_profile(self, *, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            user = self.users_repo.update_profile(
                user_id=user_id,
                nom=str(payload.get("nom", "")),
                prenom=str(payload.get("prenom", "")),
                email=str(payload.get("email", "")),
                telephone=str(payload.get("telephone", "")),
                adresse=str(payload.get("adresse", "")),
                date_naissance=str(payload.get("dateNaissance", "")),
                direction=str(payload.get("direction", "")),
                service=str(payload.get("service", "")),
                poste=str(payload.get("poste", "")),
                matricule=str(payload.get("matricule", "")),
                bureau=str(payload.get("bureau", "")),
                responsable=str(payload.get("responsable", "")),
                membre_depuis=str(payload.get("membreDepuis", "")),
                langue_preferee=str(payload.get("languePreferee", "fr")),
                theme_prefere=str(payload.get("themePrefere", "light")),
                notifications_email=bool(payload.get("notificationsEmail", True)),
                notifications_sms=bool(payload.get("notificationsSms", False)),
                two_factor_enabled=bool(payload.get("twoFactorEnabled", False)),
            )
        except ValueError:
            raise

        if not user:
            raise ValueError("USER_NOT_FOUND")
        return user.to_public_dict()

    async def logout(self, current_session: SessionModel | None) -> str | None:
        if not current_session:
            return None

        self.sessions_repo.close_session(
            current_session.id or "",
            reason="USER_LOGOUT",
            closed_before_expiry=True,
        )

        if current_session.auth_method != "oidc" or not current_session.oidc_refresh_token:
            return None

        metadata = await self._get_oidc_metadata()
        end_session_endpoint = metadata.get("end_session_endpoint")
        if not end_session_endpoint:
            return None

        params = {
            "client_id": settings.auth_oidc_client_id,
            "post_logout_redirect_uri": f"{settings.auth_frontend_base_url}/login",
        }
        return f"{end_session_endpoint}?{urlencode(params)}"

    def validate_csrf(self, *, cookie_token: str | None, header_token: str | None, current_session: SessionModel | None) -> bool:
        if not cookie_token or not header_token or not current_session:
            return False
        return cookie_token == header_token == current_session.csrf_token

    def _create_session(
        self,
        *,
        user_id: str,
        auth_method: str,
        oidc_subject: str | None = None,
        oidc_access_token: str | None = None,
        oidc_refresh_token: str | None = None,
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
            token_hash=hash_session_token(session_token),
            csrf_token=csrf_token,
            access_expires_at=access_expires_at,
            refresh_expires_at=refresh_expires_at,
            idle_expires_at=idle_expires_at,
            absolute_expires_at=absolute_expires_at,
            created_at=now,
            last_activity_at=now,
            auth_method=auth_method,
            oidc_subject=oidc_subject,
            oidc_access_token=oidc_access_token,
            oidc_refresh_token=oidc_refresh_token,
        )
        session_id = self.sessions_repo.create(session)
        session.id = session_id
        return {
            "session_token": session_token,
            "csrf_token": csrf_token,
            "session": session,
        }

    async def _get_oidc_metadata(self) -> dict[str, Any]:
        if self._oidc_metadata_cache is not None:
            return self._oidc_metadata_cache

        metadata_url = f"{settings.auth_oidc_issuer_url.rstrip('/')}/.well-known/openid-configuration"
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(metadata_url)
            response.raise_for_status()
            self._oidc_metadata_cache = response.json()
        return self._oidc_metadata_cache

    @staticmethod
    def _extract_role_from_claims(claims: dict[str, Any]) -> str:
        roles: list[str] = []
        raw_roles = claims.get("roles")
        if isinstance(raw_roles, list):
            roles.extend(str(item) for item in raw_roles)

        realm_access = claims.get("realm_access")
        if isinstance(realm_access, dict) and isinstance(realm_access.get("roles"), list):
            roles.extend(str(item) for item in realm_access["roles"])

        direct_role = claims.get("role")
        if isinstance(direct_role, str):
            roles.append(direct_role)

        lowered = {role.lower() for role in roles}
        if "admin" in lowered or "rag_finance_admin" in lowered:
            return UserRole.ADMIN.value
        return UserRole.FINANCE_USER.value

    @staticmethod
    def _get_home_path(role: str) -> str:
        return "/admin/documents/import" if role == UserRole.ADMIN.value else "/user/accueil"

    @staticmethod
    def _to_auth_user(user: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": str(user.get("id", "")),
            "nom": str(user.get("nom", "")),
            "prenom": str(user.get("prenom", "")),
            "email": str(user.get("email", "")),
            "role": str(user.get("role", "")),
            "telephone": str(user.get("telephone", "")),
            "profileImageUrl": str(user.get("profileImageUrl", "")),
            "adresse": str(user.get("adresse", "")),
            "dateNaissance": str(user.get("dateNaissance", "")),
            "direction": str(user.get("direction", "")),
            "service": str(user.get("service", "")),
            "poste": str(user.get("poste", "")),
            "matricule": str(user.get("matricule", "")),
            "bureau": str(user.get("bureau", "")),
            "responsable": str(user.get("responsable", "")),
            "membreDepuis": str(user.get("membreDepuis", "")),
            "languePreferee": str(user.get("languePreferee", "fr")),
            "themePrefere": str(user.get("themePrefere", "light")),
            "notificationsEmail": bool(user.get("notificationsEmail", True)),
            "notificationsSms": bool(user.get("notificationsSms", False)),
            "twoFactorEnabled": bool(user.get("twoFactorEnabled", False)),
            "passwordUpdatedAt": str(user.get("passwordUpdatedAt", "")),
        }
