import { BellRing, Heart, LogOut, Moon, Sun, UserPen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import cimfLogo from "../../assets/cimf-logo.png";
import type { DocumentSearchItem } from "../../models/document";
import { searchDocuments, setDocumentFavorite } from "../../services/documents.service";
import RechercheDocumentFavoritesModal from "../components/rechercheDocument/RechercheDocumentFavoritesModal";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const USER_THEME_STORAGE_KEY = "user-layout-theme";

export type UserLayoutContextValue = {
  favoriteDocuments: DocumentSearchItem[];
  openFavoritesModal: () => void;
  toggleFavoriteDocument: (item: DocumentSearchItem) => Promise<boolean>;
  refreshFavoriteDocuments: () => Promise<void>;
};

function navClassName(isActive: boolean) {
  return [
    "group relative px-1 py-2 text-[13px] font-medium transition-colors duration-300",
    isActive ? "text-[#b2342c]" : "text-slate-600 hover:text-[#b2342c]",
  ].join(" ");
}

export default function UserLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname.startsWith("/user/chat");
  const [favoriteDocuments, setFavoriteDocuments] = useState<DocumentSearchItem[]>([]);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const storedTheme = window.localStorage.getItem(USER_THEME_STORAGE_KEY);
    return storedTheme === "dark";
  });

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.classList.toggle("user-dark-theme", isDarkMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(USER_THEME_STORAGE_KEY, isDarkMode ? "dark" : "light");
    }

    return () => {
      document.body.classList.remove("user-dark-theme");
    };
  }, [isDarkMode]);

  async function refreshFavoriteDocuments() {
    try {
      const response = await searchDocuments({
        apiBaseUrl,
        favoritesOnly: true,
        sortBy: "recent",
        limit: 100,
      });

      setFavoriteDocuments(response.items);
    } catch {
      setFavoriteDocuments([]);
    }
  }

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const timer = window.setTimeout(() => {
      void refreshFavoriteDocuments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user?.id]);

  async function toggleFavoriteDocument(item: DocumentSearchItem) {
    const nextValue = !item.isFavored;

    await setDocumentFavorite({
      apiBaseUrl,
      documentId: item.id,
      isFavored: nextValue,
    });

    setFavoriteDocuments((current) => {
      if (nextValue) {
        return [{ ...item, isFavored: true }, ...current.filter((entry) => entry.id !== item.id)];
      }

      return current.filter((entry) => entry.id !== item.id);
    });

    return nextValue;
  }

  const outletContext = useMemo<UserLayoutContextValue>(
    () => ({
      favoriteDocuments,
      openFavoritesModal: () => setIsFavoritesModalOpen(true),
      toggleFavoriteDocument,
      refreshFavoriteDocuments,
    }),
    [favoriteDocuments],
  );

  return (
    <div
      className={[
        "user-theme-root min-h-screen text-[#111827] transition-colors duration-300",
        isDarkMode ? "bg-[#2a1618] text-slate-100" : "bg-[#f8f4f3]",
      ].join(" ")}
    >
      <header className={[
        "border-b px-6 py-4 shadow-sm transition-colors duration-300",
        isDarkMode ? "border-[#4d2b2f] bg-[#321b1e]" : "border-slate-200 bg-white",
      ].join(" ")}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <img
              src={cimfLogo}
              alt="Logo CIMF"
              className="h-10 w-auto object-contain"
            />

            <nav className="flex items-center gap-6">
              <NavLink to="/user/" className={({ isActive }) => navClassName(isActive)}>
                {({ isActive }) => (
                  <span className="relative inline-block">
                    Accueil
                    <span
                      className={[
                        "absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#b2342c] transition-transform duration-300",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      ].join(" ")}
                    />
                  </span>
                )}
              </NavLink>

              <NavLink to="/user/chat" className={({ isActive }) => navClassName(isActive)}>
                {({ isActive }) => (
                  <span className="relative inline-block">
                    Chat
                    <span
                      className={[
                        "absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#b2342c] transition-transform duration-300",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      ].join(" ")}
                    />
                  </span>
                )}
              </NavLink>

              <NavLink to="/user/documents/recherche" className={({ isActive }) => navClassName(isActive)}>
                {({ isActive }) => (
                  <span className="relative inline-block">
                    Recherche documents
                    <span
                      className={[
                        "absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#b2342c] transition-transform duration-300",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      ].join(" ")}
                    />
                  </span>
                )}
              </NavLink>

              <NavLink to="/user/reclamations" className={({ isActive }) => navClassName(isActive)}>
                {({ isActive }) => (
                  <span className="relative inline-block">
                    Reclamations
                    <span
                      className={[
                        "absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#b2342c] transition-transform duration-300",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      ].join(" ")}
                    />
                  </span>
                )}
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right leading-tight">
              <p className={["text-sm font-semibold", isDarkMode ? "text-[#f6eaea]" : "text-slate-900"].join(" ")}>
                {user?.prenom} {user?.nom}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/user/profil")}
              className={["cursor-pointer px-4 py-2 text-xs font-semibold transition duration-300", isDarkMode ? "text-[#dec9cb] hover:text-white" : "text-slate-700 hover:text-[#b2342c]"].join(" ")}
              title="Modifier mes donnees personnelles"
            >
              <UserPen size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsFavoritesModalOpen(true)}
              className={["relative cursor-pointer text-xs font-semibold transition duration-300", isDarkMode ? "text-[#dec9cb] hover:text-white" : "text-slate-700 hover:text-[#b2342c]"].join(" ")}
              title="Mes favoris"
            >
              <Heart size={17} />
              {favoriteDocuments.length > 0 ? (
                <span className="absolute -right-2 -top-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#b2342c] px-1 text-[10px] font-semibold text-white">
                  {favoriteDocuments.length > 99 ? "99+" : favoriteDocuments.length}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className={["cursor-pointer text-xs font-semibold transition duration-300", isDarkMode ? "text-[#dec9cb] hover:text-white" : "text-slate-700 hover:text-[#b2342c]"].join(" ")}
              title="Notifications"
            >
              <BellRing size={16} />
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className={["cursor-pointer px-4 py-2 text-xs font-semibold transition duration-300", isDarkMode ? "text-[#dec9cb] hover:text-white" : "text-slate-700 hover:border-[#b2342c] hover:text-[#b2342c]"].join(" ")}
            >
              <LogOut size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsDarkMode((current) => !current)}
              aria-label={isDarkMode ? "Activer le mode clair" : "Activer le mode sombre"}
              title={isDarkMode ? "Mode clair" : "Mode sombre"}
              className={[
                "relative inline-flex h-10 w-[92px] items-center rounded-[999px] border p-1 transition-all duration-300",
                isDarkMode
                  ? "border-[#e6cfd1] bg-[#f6ebec]"
                  : "border-[#f1e2df] bg-[#fff7f6]",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(15,23,42,0.12)] transition-transform duration-300",
                  isDarkMode ? "translate-x-[48px]" : "translate-x-0",
                ].join(" ")}
              >
                {isDarkMode ? (
                  <Moon size={16} className="text-[#8f2632]" />
                ) : (
                  <Sun size={16} className="text-[#f1b300]" />
                )}
              </span>

              <span className="pointer-events-none flex w-full items-center justify-between px-2">
                <Sun size={18} className={isDarkMode ? "text-[#d8b4b8] opacity-35" : "text-[#ef4b44] opacity-100"} />
                <Moon size={18} className={isDarkMode ? "text-[#d9a5ab] opacity-100" : "text-[#d8b4b8] opacity-35"} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className={isChatPage ? "px-0 py-0" : "w-full "}>
        <Outlet context={outletContext} />
      </main>

      <RechercheDocumentFavoritesModal
        open={isFavoritesModalOpen}
        items={favoriteDocuments}
        apiBaseUrl={apiBaseUrl}
        onClose={() => setIsFavoritesModalOpen(false)}
        onSelect={(item) => {
          navigate(`/user/documents/recherche?query=${encodeURIComponent(item.title)}&documentId=${encodeURIComponent(item.id)}`);
          setIsFavoritesModalOpen(false);
        }}
        onToggleFavorite={(item) => void toggleFavoriteDocument(item)}
      />
    </div>
  );
}
