from datetime import UTC, datetime

from app.core.database import get_users_collection
from app.models import UserModel
from app.repositories.index_helpers import create_partial_unique_string_index
from bson import ObjectId
from pymongo.errors import DuplicateKeyError


class UsersRepository:
    def get_by_email(self, email: str) -> UserModel | None:
        normalized = email.strip().lower()
        raw = get_users_collection().find_one({"email": normalized, "deletedAt": None})
        if not raw:
            return None
        return UserModel.from_mongo(raw)

    def get_by_id(self, user_id: str) -> UserModel | None:
        object_id = self._parse_user_id(user_id)
        if not object_id:
            return None

        raw = get_users_collection().find_one({"_id": object_id, "deletedAt": None})
        if not raw:
            return None
        return UserModel.from_mongo(raw)

    def list_by_roles(self, roles: list[str]) -> list[UserModel]:
        normalized_roles = [role for role in roles if role]
        if not normalized_roles:
            return []

        cursor = get_users_collection().find({"role": {"$in": normalized_roles}, "deletedAt": None})
        return [UserModel.from_mongo(raw) for raw in cursor]

    def list_all(self) -> list[UserModel]:
        cursor = get_users_collection().find({"deletedAt": None})
        return [UserModel.from_mongo(raw) for raw in cursor]

    def update_profile(
        self,
        *,
        user_id: str,
        nom: str,
        prenom: str,
        email: str,
        telephone: str,
        avatar_url: str,
        adresse: str,
        birth_date: str,
        direction: str,
        service: str,
        poste: str,
        matricule: str,
        bureau: str,
        manager: str,
        member_since: str,
        preferred_language: str,
        preferred_theme: str,
        email_notifications_on: bool,
        sms_notifications_on: bool,
        is_two_factor_enabled: bool,
    ) -> UserModel | None:
        object_id = self._parse_user_id(user_id)
        if not object_id:
            return None

        normalized = email.strip().lower()
        collection = get_users_collection()

        try:
            result = collection.update_one(
                {"_id": object_id, "deletedAt": None},
                {
                    "$set": {
                        "nom": nom,
                        "prenom": prenom,
                        "email": normalized,
                        "telephone": telephone,
                        "avatarUrl": avatar_url,
                        "adresse": adresse,
                        "birthDate": birth_date,
                        "direction": direction,
                        "service": service,
                        "poste": poste,
                        "matricule": matricule,
                        "bureau": bureau,
                        "manager": manager,
                        "memberSince": member_since,
                        "preferredLanguage": preferred_language,
                        "preferredTheme": preferred_theme,
                        "emailNotificationsOn": email_notifications_on,
                        "smsNotificationsOn": sms_notifications_on,
                        "isTwoFactorEnabled": is_two_factor_enabled,
                    }
                },
            )
        except DuplicateKeyError:
            raise ValueError("EMAIL_ALREADY_USED") from None

        if result.matched_count == 0:
            return None

        raw = collection.find_one({"_id": object_id, "deletedAt": None})
        if not raw:
            return None
        return UserModel.from_mongo(raw)

    def change_password(self, *, user_id: str, password_hash: str) -> UserModel | None:
        object_id = self._parse_user_id(user_id)
        if not object_id:
            return None

        result = get_users_collection().update_one(
            {"_id": object_id, "deletedAt": None},
            {
                "$set": {
                    "password": password_hash,
                    "passwordChangedAt": datetime.now(UTC),
                }
            },
        )
        if result.matched_count == 0:
            return None

        raw = get_users_collection().find_one({"_id": object_id, "deletedAt": None})
        if not raw:
            return None
        return UserModel.from_mongo(raw)

    def save_oidc_user(
        self,
        *,
        nom: str,
        prenom: str,
        email: str,
        password_hash: str,
        role: str,
        telephone: str = "",
        avatar_url: str = "",
        adresse: str = "",
        birth_date: str = "",
        direction: str = "",
        service: str = "",
        poste: str = "",
        matricule: str = "",
        bureau: str = "",
        manager: str = "",
        member_since: str = "",
    ) -> str:
        normalized = email.strip().lower()
        collection = get_users_collection()
        collection.update_one(
            {"email": normalized},
            {
                "$set": {
                    "nom": nom,
                    "prenom": prenom,
                    "email": normalized,
                    "password": password_hash,
                    "role": role,
                    "telephone": telephone,
                    "avatarUrl": avatar_url,
                    "adresse": adresse,
                    "birthDate": birth_date,
                    "direction": direction,
                    "service": service,
                    "poste": poste,
                    "matricule": matricule,
                    "bureau": bureau,
                    "manager": manager,
                    "memberSince": member_since,
                    "deletedAt": None,
                },
                "$setOnInsert": {"createdAt": datetime.now(UTC)},
            },
            upsert=True,
        )
        raw = collection.find_one({"email": normalized}, {"_id": 1})
        return str(raw["_id"])

    def ensure_indexes(self) -> None:
        create_partial_unique_string_index(get_users_collection(), "email")

    @staticmethod
    def _parse_user_id(user_id: str) -> ObjectId | None:
        try:
            return ObjectId(user_id)
        except Exception:
            return None
