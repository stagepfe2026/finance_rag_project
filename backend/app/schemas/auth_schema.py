from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=1)


class AuthUserOut(BaseModel):
    id: str
    nom: str
    prenom: str
    email: str
    role: str
    telephone: str = ""
    avatarUrl: str = ""
    adresse: str = ""
    birthDate: str = ""
    direction: str = ""
    service: str = ""
    poste: str = ""
    matricule: str = ""
    bureau: str = ""
    manager: str = ""
    memberSince: str = ""
    preferredLanguage: str = "fr"
    preferredTheme: str = "light"
    emailNotificationsOn: bool = True
    smsNotificationsOn: bool = False
    isTwoFactorEnabled: bool = False
    passwordChangedAt: str = ""


class ProfileUpdateRequest(BaseModel):
    nom: str = Field(min_length=1, max_length=80)
    prenom: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=160)
    telephone: str = Field(default="", max_length=40)
    avatarUrl: str = Field(default="", max_length=500_000)
    adresse: str = Field(default="", max_length=240)
    birthDate: str = Field(default="", max_length=20)
    direction: str = Field(default="", max_length=120)
    service: str = Field(default="", max_length=120)
    poste: str = Field(default="", max_length=120)
    matricule: str = Field(default="", max_length=80)
    bureau: str = Field(default="", max_length=120)
    manager: str = Field(default="", max_length=120)
    memberSince: str = Field(default="", max_length=20)
    preferredLanguage: str = Field(default="fr", max_length=10)
    preferredTheme: str = Field(default="light", max_length=20)
    emailNotificationsOn: bool = True
    smsNotificationsOn: bool = False
    isTwoFactorEnabled: bool = False

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.rsplit("@", 1)[-1]:
            raise ValueError("Adresse email invalide.")
        return normalized

    @field_validator(
        "nom",
        "prenom",
        "telephone",
        "avatarUrl",
        "adresse",
        "birthDate",
        "direction",
        "service",
        "poste",
        "matricule",
        "bureau",
        "manager",
        "memberSince",
        "preferredLanguage",
        "preferredTheme",
    )
    @classmethod
    def trim_text(cls, value: str) -> str:
        return value.strip()


class SessionInfoOut(BaseModel):
    authenticated: bool
    user: AuthUserOut | None = None
    access_expires_at: str | None = None
    refresh_expires_at: str | None = None
    idle_expires_at: str | None = None
    absolute_expires_at: str | None = None
    message: str | None = None


class AuthResponse(BaseModel):
    success: bool
    message: str
    user: AuthUserOut | None = None
    redirect_to: str | None = None
    session: SessionInfoOut | None = None


class OidcLoginStartOut(BaseModel):
    authorization_url: str
