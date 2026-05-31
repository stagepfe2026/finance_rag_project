from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any


class UserRole(StrEnum):
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
            created_at=raw.get("createdAt") or datetime.now(UTC),
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
        }
