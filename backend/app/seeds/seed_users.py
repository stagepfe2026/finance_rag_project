from datetime import datetime, timezone
from pathlib import Path
import sys

# Permet d'executer le script depuis le dossier backend.
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.security import hash_password
from app.models import UserRole
from app.repositories import UsersRepository


def seed_users() -> None:
    repo = UsersRepository()
    repo.ensure_indexes()

    users = [
        {
            "nom": "Abidi",
            "prenom": "Hatem",
            "email": "hatem_abidi@cimf.local",
            "password": "password123",
            "role": UserRole.ADMIN.value,
            "telephone": "+216 71 222 110",
            "avatar_url": "https://randomuser.me/api/portraits/men/46.jpg",
            "adresse": "Avenue Habib Bourguiba, Tunis",
            "birth_date": "1983-04-11",
            "direction": "Direction generale des impots",
            "service": "Service pilotage et coordination numerique",
            "poste": "Administrateur de plateforme",
            "matricule": "MAT-ADM-2024-0001",
            "bureau": "Batiment A, Bureau 201",
            "manager": "Secretaire general des finances",
            "member_since": "2018-01-15",
            "preferred_language": "fr",
            "preferred_theme": "light",
            "email_notifications_on": True,
            "sms_notifications_on": True,
            "is_two_factor_enabled": True,
            "password_changed_at": datetime(2026, 3, 12, 8, 30, tzinfo=timezone.utc),
        },
        {
            "nom": "Ben Ali",
            "prenom": "Ahmed",
            "email": "ahmed_benali@cimf.local",
            "password": "password123",
            "role": UserRole.FINANCE_USER.value,
            "telephone": "+212 537 67 89 00",
            "avatar_url": "https://randomuser.me/api/portraits/men/32.jpg",
            "adresse": "Boulevard Mohammed V, Rabat",
            "birth_date": "1985-01-15",
            "direction": "Direction du Budget",
            "service": "Service analyse budgetaire",
            "poste": "Directeur Adjoint",
            "matricule": "MAT-2024-12345",
            "bureau": "Batiment B, Bureau 304",
            "manager": "Fatima Zahra El Amrani",
            "member_since": "2015-09-01",
            "preferred_language": "fr",
            "preferred_theme": "light",
            "email_notifications_on": True,
            "sms_notifications_on": False,
            "is_two_factor_enabled": True,
            "password_changed_at": datetime(2026, 3, 12, 7, 0, tzinfo=timezone.utc),
        },
    ]

    for user in users:
        user_id = repo.save_oidc_user(
            nom=user["nom"],
            prenom=user["prenom"],
            email=user["email"],
            password_hash=hash_password(user["password"]),
            role=user["role"],
            telephone=user["telephone"],
            avatar_url=user["avatar_url"],
            adresse=user["adresse"],
            birth_date=user["birth_date"],
            direction=user["direction"],
            service=user["service"],
            poste=user["poste"],
            matricule=user["matricule"],
            bureau=user["bureau"],
            manager=user["manager"],
            member_since=user["member_since"],
            preferred_language=user["preferred_language"],
            preferred_theme=user["preferred_theme"],
            email_notifications_on=user["email_notifications_on"],
            sms_notifications_on=user["sms_notifications_on"],
            is_two_factor_enabled=user["is_two_factor_enabled"],
            password_changed_at=user["password_changed_at"],
        )
        print(f"[seed] user={user['email']} role={user['role']} id={user_id}")

    print("\nCredentials de test:")
    print("- hatem_abidi@cimf.local / password123 (ADMIN)")
    print("- ahmed_benali@cimf.local / password123 (FINANCE_USER)")


if __name__ == "__main__":
    seed_users()


