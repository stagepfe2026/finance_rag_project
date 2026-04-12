import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  beginOidcLogin,
  fetchSession,
  loginRequest,
  logoutRequest,
  refreshSessionRequest,
  type AuthUser,
  type SessionInfo,
} from "../services/auth.service";

type AuthContextValue = {
  user: AuthUser | null;
  session: SessionInfo | null;
  loading: boolean;
  isAuthenticated: boolean;
  authMessage: string | null;
  login: (payload: { email: string; password: string }) => Promise<{ redirectTo: string }>;
  logout: () => Promise<void>;
  clearAuthMessage: () => void;
  beginProviderLogin: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const IDLE_TIMEOUT_MS = Number(import.meta.env.VITE_AUTH_IDLE_TIMEOUT_MS ?? 30 * 60 * 1000);
const REFRESH_INTERVAL_MS = Number(import.meta.env.VITE_AUTH_REFRESH_INTERVAL_MS ?? 12 * 60 * 1000);
const SESSION_EXPIRED_MESSAGE = "Votre session a expire. Veuillez vous reconnecter.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;

    async function loadInitialSession() {
      try {
        const nextSession = await fetchSession();
        if (!cancelled) {
          setSession(nextSession.authenticated ? nextSession : null);
        }
      } catch (error) {
        const typedError = error as Error & { code?: string };
        if (!cancelled) {
          setSession(null);
          if (typedError.code && typedError.code !== "UNAUTHORIZED") {
            setAuthMessage(typedError.message || SESSION_EXPIRED_MESSAGE);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session?.authenticated) {
      return;
    }

    function markActivity() {
      lastActivityRef.current = Date.now();
    }

    const events: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));

    const idleTimer = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        setSession(null);
        setAuthMessage(SESSION_EXPIRED_MESSAGE);
        window.clearInterval(idleTimer);
      }
    }, 30_000);

    const refreshTimer = window.setInterval(() => {
      void refreshSession();
    }, REFRESH_INTERVAL_MS);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      window.clearInterval(idleTimer);
      window.clearInterval(refreshTimer);
    };
  }, [session?.authenticated]);

  async function login(payload: { email: string; password: string }) {
    const response = await loginRequest(payload.email, payload.password);
    setSession(response.session?.authenticated ? response.session : null);
    setAuthMessage(null);
    lastActivityRef.current = Date.now();
    return { redirectTo: response.redirect_to || "/" };
  }

  async function refreshSession() {
    try {
      const response = await refreshSessionRequest();
      if (response.session?.authenticated) {
        setSession(response.session);
      }
    } catch (error) {
      const typedError = error as Error;
      setSession(null);
      setAuthMessage(typedError.message || SESSION_EXPIRED_MESSAGE);
    }
  }

  async function logout() {
    try {
      const response = await logoutRequest();
      setSession(null);
      setAuthMessage(null);
      if (response.redirect_to && /^https?:/i.test(response.redirect_to)) {
        window.location.assign(response.redirect_to);
      }
    } finally {
      setSession(null);
    }
  }

  async function beginProviderLogin() {
    await beginOidcLogin();
  }

  function clearAuthMessage() {
    setAuthMessage(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isAuthenticated: Boolean(session?.authenticated && session.user),
      authMessage,
      login,
      logout,
      clearAuthMessage,
      beginProviderLogin,
      refreshSession,
    }),
    [authMessage, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
