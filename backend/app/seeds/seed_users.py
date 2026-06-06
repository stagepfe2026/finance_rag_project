import sys
from pathlib import Path

# Permet d'executer le script directement, y compris dans le conteneur Docker.
sys.path.append(str(Path(__file__).resolve().parents[2]))

from app.core.security import hash_password
from app.models import UserRole
from app.repositories import UsersRepository


def seed_users() -> None:
    repo = UsersRepository()
    repo.ensure_indexes()

    # Comptes de reference pour tester les deux parcours applicatifs:
    # - ADMIN pour l'administration et l'indexation des documents.
    # - FINANCE_USER pour l'espace utilisateur et les recherches RAG.
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
        },
    ]

    for user in users:
        # save_oidc_user est reutilise ici pour creer ou mettre a jour le profil
        # sans dupliquer un compte si le seed est lance plusieurs fois.
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
        )
        print(f"[seed] user={user['email']} role={user['role']} id={user_id}")

    print("\nCredentials de test:")
    print("- hatem_abidi@cimf.local / password123 (ADMIN)")
    print("- ahmed_benali@cimf.local / password123 (FINANCE_USER)")


if __name__ == "__main__":
    seed_users()


