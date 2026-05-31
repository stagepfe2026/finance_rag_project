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
