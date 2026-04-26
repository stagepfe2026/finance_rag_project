const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type AuthUser = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: "ADMIN" | "FINANCE_USER";
  telephone: string;
  profileImageUrl: string;
  adresse: string;
  dateNaissance: string;
  direction: string;
  service: string;
  poste: string;
  matricule: string;
  bureau: string;
  responsable: string;
  membreDepuis: string;
  languePreferee: string;
  themePrefere: string;
  notificationsEmail: boolean;
  notificationsSms: boolean;
  twoFactorEnabled: boolean;
  passwordUpdatedAt: string;
};

export type ProfileUpdatePayload = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  dateNaissance: string;
  direction: string;
  service: string;
  poste: string;
  matricule: string;
  bureau: string;
  responsable: string;
  membreDepuis: string;
  languePreferee: string;
  themePrefere: string;
  notificationsEmail: boolean;
  notificationsSms: boolean;
  twoFactorEnabled: boolean;
};

export type SessionInfo = {
  authenticated: boolean;
  user: AuthUser | null;
  access_expires_at: string | null;
  refresh_expires_at: string | null;
  idle_expires_at: string | null;
  absolute_expires_at: string | null;
  message?: string | null;
};

export type AuthResponse = {
  success: boolean;
  message: string;
  user: AuthUser | null;
  redirect_to: string | null;
  session: SessionInfo | null;
};

function parseJson(response: Response) {
  return response.json().catch(() => null);
}

function readErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (typeof detail === "object" && detail && "message" in detail) {
      const message = (detail as { message?: unknown }).message;
      if (typeof message === "string") {
        return message;
      }
    }
  }
  if (typeof data === "object" && data && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return fallback;
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Identifiants invalides."));
  }

  return data as AuthResponse;
}

export async function fetchSession(): Promise<SessionInfo> {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/session`, {
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    const error = new Error(readErrorMessage(data, "Session invalide."));
    (error as Error & { code?: string }).code =
      typeof data === "object" && data && "detail" in data && typeof (data as { detail?: unknown }).detail === "object"
        ? String(((data as { detail?: { code?: string } }).detail?.code ?? "UNAUTHORIZED"))
        : "UNAUTHORIZED";
    throw error;
  }

  return data as SessionInfo;
}

export async function refreshSessionRequest(): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    const error = new Error(readErrorMessage(data, "Impossible de rafraichir la session."));
    (error as Error & { code?: string }).code =
      typeof data === "object" && data && "detail" in data && typeof (data as { detail?: unknown }).detail === "object"
        ? String(((data as { detail?: { code?: string } }).detail?.code ?? "REFRESH_EXPIRED"))
        : "REFRESH_EXPIRED";
    throw error;
  }

  return data as AuthResponse;
}

function readCookie(name: string) {
  const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function updateProfileRequest(payload: ProfileUpdatePayload): Promise<AuthResponse> {
  const csrfCookieName = import.meta.env.VITE_AUTH_CSRF_COOKIE_NAME ?? "rag_finance_csrf";
  const csrfToken = readCookie(csrfCookieName);

  const response = await fetch(`${apiBaseUrl}/api/v1/auth/profile`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Impossible de modifier les donnees personnelles."));
  }

  return data as AuthResponse;
}

export async function logoutRequest(): Promise<AuthResponse> {
  const csrfCookieName = import.meta.env.VITE_AUTH_CSRF_COOKIE_NAME ?? "rag_finance_csrf";
  const csrfToken = readCookie(csrfCookieName);

  const response = await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant la deconnexion."));
  }

  return data as AuthResponse;
}

export async function beginOidcLogin(): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/oidc/login`, {
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok || !data || typeof data !== "object" || !("authorization_url" in data)) {
    throw new Error(readErrorMessage(data, "Impossible de demarrer la connexion OIDC."));
  }

  window.location.assign(String((data as { authorization_url: string }).authorization_url));
}

