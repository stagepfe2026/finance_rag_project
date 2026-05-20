from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    FINANCE_USER = "FINANCE_USER"


@dataclass
class UserModel:
    nom: str
    prenom: str
    email: str
    password_hash: str
    role: UserRole
    created_at: datetime
    telephone: str = ""
    avatar_url: str = ""
    adresse: str = ""
    birth_date: str = ""
    direction: str = ""
    service: str = ""
    poste: str = ""
    matricule: str = ""
    bureau: str = ""
    manager: str = ""
    member_since: str = ""
    preferred_language: str = "fr"
    preferred_theme: str = "light"
    email_notifications_on: bool = True
    sms_notifications_on: bool = False
    is_two_factor_enabled: bool = False
    password_changed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: datetime | None = None
    id: str | None = None

    @classmethod
    def from_mongo(cls, raw: dict[str, Any]) -> "UserModel":
        role_value = str(raw.get("role", UserRole.FINANCE_USER.value))
        role = UserRole(role_value) if role_value in UserRole._value2member_map_ else UserRole.FINANCE_USER
        return cls(
            id=str(raw.get("_id")) if raw.get("_id") is not None else None,
            nom=str(raw.get("nom", "")),
            prenom=str(raw.get("prenom", "")),
            email=str(raw.get("email", "")).lower().strip(),
            password_hash=str(raw.get("password", "")),
            role=role,
            created_at=raw.get("createdAt") or datetime.now(timezone.utc),
            telephone=str(raw.get("telephone", "")),
            avatar_url=str(raw.get("avatarUrl", "")),
            adresse=str(raw.get("adresse", "")),
            birth_date=str(raw.get("birthDate", "")),
            direction=str(raw.get("direction", "")),
            service=str(raw.get("service", "")),
            poste=str(raw.get("poste", "")),
            matricule=str(raw.get("matricule", "")),
            bureau=str(raw.get("bureau", "")),
            manager=str(raw.get("manager", "")),
            member_since=str(raw.get("memberSince", "")),
            preferred_language=str(raw.get("preferredLanguage", "fr")),
            preferred_theme=str(raw.get("preferredTheme", "light")),
            email_notifications_on=bool(raw.get("emailNotificationsOn", True)),
            sms_notifications_on=bool(raw.get("smsNotificationsOn", False)),
            is_two_factor_enabled=bool(raw.get("isTwoFactorEnabled", False)),
            password_changed_at=raw.get("passwordChangedAt") or datetime.now(timezone.utc),
            deleted_at=raw.get("deletedAt"),
        )

    def to_mongo_insert(self) -> dict[str, Any]:
        return {
            "nom": self.nom,
            "prenom": self.prenom,
            "email": self.email.lower().strip(),
            "password": self.password_hash,
            "role": self.role.value,
            "telephone": self.telephone,
            "avatarUrl": self.avatar_url,
            "adresse": self.adresse,
            "birthDate": self.birth_date,
            "direction": self.direction,
            "service": self.service,
            "poste": self.poste,
            "matricule": self.matricule,
            "bureau": self.bureau,
            "manager": self.manager,
            "memberSince": self.member_since,
            "preferredLanguage": self.preferred_language,
            "preferredTheme": self.preferred_theme,
            "emailNotificationsOn": self.email_notifications_on,
            "smsNotificationsOn": self.sms_notifications_on,
            "isTwoFactorEnabled": self.is_two_factor_enabled,
            "passwordChangedAt": self.password_changed_at,
            "createdAt": self.created_at,
            "deletedAt": self.deleted_at,
        }

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "id": self.id or "",
            "nom": self.nom,
            "prenom": self.prenom,
            "email": self.email,
            "role": self.role.value,
            "telephone": self.telephone,
            "avatarUrl": self.avatar_url,
            "adresse": self.adresse,
            "birthDate": self.birth_date,
            "direction": self.direction,
            "service": self.service,
            "poste": self.poste,
            "matricule": self.matricule,
            "bureau": self.bureau,
            "manager": self.manager,
            "memberSince": self.member_since,
            "preferredLanguage": self.preferred_language,
            "preferredTheme": self.preferred_theme,
            "emailNotificationsOn": self.email_notifications_on,
            "smsNotificationsOn": self.sms_notifications_on,
            "isTwoFactorEnabled": self.is_two_factor_enabled,
            "passwordChangedAt": self.password_changed_at.isoformat(),
        }
