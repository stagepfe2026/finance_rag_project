import { BellRing, Heart, LogOut, Moon, Sun, UserPen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import cimfLogo from "../../assets/cimf-logo.png";
import type { DocumentSearchItem } from "../../models/document";
import type { NotificationItem } from "../../models/notification";
import { searchDocuments, setDocumentFavorite } from "../../services/documents.service";
import {
  createNotificationsWebSocket,
  fetchNotifications,
  markNotificationAsRead,
} from "../../services/notifications.service";
import UserNotificationsModal from "../components/notifications/UserNotificationsModal";
import RechercheDocumentFavoritesModal from "../components/rechercheDocument/RechercheDocumentFavoritesModal";
import HelpCard from "../components/acceuil/HelpCard";

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
    isActive ? "text-[#273043]" : "text-slate-600 hover:text-[#273043]",
  ].join(" ");
}

export default function UserLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname.startsWith("/user/chat");
  const isGuidePage = location.pathname.startsWith("/user/guide");
  const [favoriteDocuments, setFavoriteDocuments] = useState<DocumentSearchItem[]>([]);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const storedTheme = window.localStorage.getItem(USER_THEME_STORAGE_KEY);
    return storedTheme === "dark";
  });
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

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

  useEffect(() => {
    function updateHeaderState() {
      setIsHeaderScrolled(window.scrollY > 8);
    }

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateHeaderState);
    };
  }, []);

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

  async function refreshNotifications() {
    try {
      setIsNotificationsLoading(true);
      setNotificationsError("");
      const response = await fetchNotifications(100);
      setNotifications(response.items);
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Erreur pendant le chargement des notifications.");
      setNotifications([]);
    } finally {
      setIsNotificationsLoading(false);
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

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const timer = window.setTimeout(() => {
      void refreshNotifications();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const socket = createNotificationsWebSocket({
      onNotification: ({ data }) => {
        setNotifications((current) => [data, ...current.filter((item) => item.id !== data.id)].slice(0, 100));
      },
    });

    return () => {
      socket.close();
    };
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

  async function handleOpenNotifications() {
    setIsNotificationsModalOpen(true);
    void refreshNotifications();
  }

  async function handleMarkNotificationAsRead(notification: NotificationItem) {
    if (notification.isRead) {
      return;
    }

    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
    );

    try {
      await markNotificationAsRead(notification.id);
    } catch {
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, isRead: false } : item)),
      );
    }
  }

  function handleDismissNotification(notificationId: string) {
    setNotifications((current) => current.filter((item) => item.id !== notificationId));
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
  const unreadNotificationsCount = notifications.filter((item) => !item.isRead).length;

  if (isGuidePage) {
    return (
      <div
        className={[
          "user-theme-root min-h-screen text-[#111827] transition-colors duration-300",
          isDarkMode ? "bg-[#273043] text-slate-100" : "bg-slate-50",
        ].join(" ")}
      >
        <main className="h-screen w-full overflow-hidden">
          <Outlet context={outletContext} />
        </main>
      </div>
    );
  }

  return (
    <div
      className={[
        "user-theme-root min-h-screen text-[#111827] transition-colors duration-300",
        isDarkMode ? "bg-[#273043] text-slate-100" : "bg-slate-50",
      ].join(" ")}
    >
      <header className={[
        "sticky top-0 z-40 border-b px-6 py-4 backdrop-blur transition-[background-color,border-color,box-shadow] duration-300",
        isHeaderScrolled ? "shadow-[0_8px_24px_rgba(15,23,42,0.08)]" : "shadow-sm",
        isDarkMode ? "border-[#11116f] bg-[#273043]/95" : "border-slate-200 bg-white/95",
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
                        "absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#9d0208] transition-transform duration-300",
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
                        "absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#9d0208] transition-transform duration-300",
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
                        "absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#9d0208] transition-transform duration-300",
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
                        "absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#9d0208] transition-transform duration-300",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      ].join(" ")}
                    />
                  </span>
                )}
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/user/profil")}
              className={["cursor-pointer px-4 py-2 text-xs font-semibold transition duration-300", isDarkMode ? "text-[#dec9cb] hover:text-white" : "text-slate-700 hover:text-[#273043]"].join(" ")}
              title="Modifier mes donnees personnelles"
            >
              <UserPen size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsFavoritesModalOpen(true)}
              className={["relative cursor-pointer text-xs font-semibold transition duration-300", isDarkMode ? "text-[#dec9cb] hover:text-white" : "text-slate-700 hover:text-[#273043]"].join(" ")}
              title="Mes favoris"
            >
              <Heart size={17} />
              {favoriteDocuments.length > 0 ? (
                <span className="absolute -right-2 -top-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#9d0208] px-1 text-[10px] font-semibold text-white">
                  {favoriteDocuments.length > 99 ? "99+" : favoriteDocuments.length}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => void handleOpenNotifications()}
              className={["relative cursor-pointer text-xs font-semibold transition duration-300", isDarkMode ? "text-[#dec9cb] hover:text-white" : "text-slate-700 hover:text-[#273043]"].join(" ")}
              title="Notifications"
            >
              <BellRing size={16} />
              {unreadNotificationsCount > 0 ? (
                <span className="absolute -right-2 -top-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#9d0208] px-1 text-[10px] font-semibold text-white">
                  {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className={["cursor-pointer px-4 py-2 text-xs font-semibold transition duration-300", isDarkMode ? "text-[#dec9cb] hover:text-white" : "text-slate-700 hover:border-[#273043] hover:text-[#273043]"].join(" ")}
            >
              <LogOut size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsDarkMode((current) => !current)}
              aria-label={isDarkMode ? "Activer le mode clair" : "Activer le mode sombre"}
              title={isDarkMode ? "Mode clair" : "Mode sombre"}
              className={[
                "relative inline-flex h-10 w-[92px] items-center rounded-xl border p-1 transition-all duration-300",
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
                  <Moon size={16} className="text-[#9d0208]" />
                ) : (
                  <Sun size={16} className="text-[#f1b300]" />
                )}
              </span>

              <span className="pointer-events-none flex w-full items-center justify-between px-2">
                <Sun size={18} className={isDarkMode ? "text-[#d8b4b8] opacity-35" : "text-[#9d0208] opacity-100"} />
                <Moon size={18} className={isDarkMode ? "text-[#d9a5ab] opacity-100" : "text-[#d8b4b8] opacity-35"} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className={isChatPage ? "px-0 py-0" : "w-full "}>
        <Outlet context={outletContext} />
      </main>

      <HelpCard />

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
      <UserNotificationsModal
        open={isNotificationsModalOpen}
        items={notifications}
        isLoading={isNotificationsLoading}
        error={notificationsError}
        onClose={() => setIsNotificationsModalOpen(false)}
        onDismiss={handleDismissNotification}
        onMarkAsRead={(notification) => void handleMarkNotificationAsRead(notification)}
      />
    </div>
  );
}
