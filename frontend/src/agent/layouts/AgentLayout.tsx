import { BellRing, Heart, LogOut, Moon, Sun, UserPen } from "lucide-react";
import { useMemo } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import cimfLogo from "../../assets/cimf-logo.png";
import cimfLogoWhite from "../../assets/cimf-logo-white.png";
import AccessibilityMenu from "../../components/accessibility/AccessibilityMenu";
import type { DocumentSearchItem } from "../../models/document";
import { useAgentLayoutViewModel } from "../viewmodels/useAgentLayoutViewModel";
import UserNotificationsModal from "../components/notifications/UserNotificationsModal";
import RechercheDocumentFavoritesModal from "../components/rechercheDocument/RechercheDocumentFavoritesModal";
import HelpCard from "../components/acceuil/HelpCard";
import Snackbar from "../components/chat/Snackbar";

const USER_HIGH_CONTRAST_STORAGE_KEY = "user-layout-high-contrast";

export type UserLayoutContextValue = {
  favoriteDocuments: DocumentSearchItem[];
  openFavoritesModal: () => void;
  toggleFavoriteDocument: (item: DocumentSearchItem) => Promise<boolean>;
  refreshFavoriteDocuments: () => Promise<void>;
  registerGeneratingMessage: (messageId: string, conversationId: string) => void;
};

function navClassName(isActive: boolean) {
  return [
    "group relative px-1 py-2 text-[13px] font-medium transition-colors duration-300",
    isActive ? "text-[#273043]" : "text-slate-600 hover:text-[#273043]",
  ].join(" ");
}

export default function UserLayout() {
  const { logout } = useAuth();
  const location   = useLocation();
  const navigate   = useNavigate();
  const vm         = useAgentLayoutViewModel();

  const normalizedPathname = location.pathname.replace(/\/+$/, "");
  const isHomePage  = normalizedPathname === "/user" || normalizedPathname === "/user/accueil";
  const isChatPage  = location.pathname.startsWith("/user/chat");
  const isGuidePage = location.pathname.startsWith("/user/guide");

  const outletContext = useMemo<UserLayoutContextValue>(
    () => ({
      favoriteDocuments:        vm.favoriteDocuments,
      openFavoritesModal:       vm.openFavoritesModal,
      toggleFavoriteDocument:   vm.toggleFavoriteDocument,
      refreshFavoriteDocuments: vm.refreshFavoriteDocuments,
      registerGeneratingMessage: vm.registerGeneratingMessage,
    }),
    [vm.favoriteDocuments, vm.openFavoritesModal, vm.toggleFavoriteDocument, vm.refreshFavoriteDocuments, vm.registerGeneratingMessage],
  );

  if (isGuidePage) {
    return (
      <div className={["user-theme-root min-h-screen text-[#111827] transition-colors duration-300", vm.isDarkMode ? "bg-[#0f172a] text-[#f3f4f6]" : "bg-slate-50"].join(" ")}>
        <main className="h-screen w-full overflow-hidden">
          <Outlet context={outletContext} />
        </main>
        <Snackbar
          open={vm.chatSnackbar.open}
          message={vm.chatSnackbar.message}
          tone="success"
          onClick={vm.chatSnackbar.href ? vm.handleChatSnackbarClick : undefined}
        />
      </div>
    );
  }

  return (
    <div className={["user-theme-root min-h-screen text-[#111827] transition-colors duration-300", vm.isDarkMode ? "bg-[#0f172a] text-[#f3f4f6]" : "bg-slate-50"].join(" ")}>
      <header className={[
        "sticky top-0 z-40 border-b px-6 py-4 backdrop-blur transition-[background-color,border-color,box-shadow] duration-300",
        vm.isHeaderScrolled ? "shadow-[0_8px_24px_rgba(15,23,42,0.08)]" : "shadow-sm",
        vm.isDarkMode ? "border-[#1e2d42] bg-[#0f172a]/95" : "border-slate-200 bg-white/95",
      ].join(" ")}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <img src={vm.isDarkMode ? cimfLogoWhite : cimfLogo} alt="Logo CIMF" className="h-10 w-auto object-contain" />

            <nav className="flex items-center gap-6" aria-label="Navigation principale utilisateur">
              <NavLink to="/user/accueil" end aria-label="Page d'accueil utilisateur" className={() => navClassName(isHomePage)}>
                {() => (
                  <span className="relative inline-block">
                    Accueil
                    <span className={["absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#9d0208] transition-transform duration-300", isHomePage ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"].join(" ")} />
                  </span>
                )}
              </NavLink>

              <NavLink to="/user/chat" aria-label="Discussion avec l'assistant" className={({ isActive }) => navClassName(isActive)}>
                {({ isActive }) => (
                  <span className="relative inline-block">
                    Chat
                    <span className={["absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#9d0208] transition-transform duration-300", isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"].join(" ")} />
                  </span>
                )}
              </NavLink>

              <NavLink to="/user/documents/recherche" aria-label="Recherche de documents" className={({ isActive }) => navClassName(isActive)}>
                {({ isActive }) => (
                  <span className="relative inline-block">
                    Recherche documents
                    <span className={["absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#9d0208] transition-transform duration-300", isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"].join(" ")} />
                  </span>
                )}
              </NavLink>

              <NavLink to="/user/reclamations" aria-label="Reclamations utilisateur" className={({ isActive }) => navClassName(isActive)}>
                {({ isActive }) => (
                  <span className="relative inline-block">
                    Reclamations
                    <span className={["absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#9d0208] transition-transform duration-300", isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"].join(" ")} />
                  </span>
                )}
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button type="button" aria-label="Modifier mes donnees personnelles" onClick={() => navigate("/user/profil")} className={["cursor-pointer px-4 py-2 text-xs font-semibold transition duration-300", vm.isDarkMode ? "text-[#dec9cb] hover:text-white" : "text-slate-700 hover:text-[#273043]"].join(" ")} title="Modifier mes donnees personnelles">
              <UserPen size={14} />
            </button>

            <button type="button" aria-label="Ouvrir mes documents favoris" onClick={vm.openFavoritesModal} className={["relative cursor-pointer text-xs font-semibold transition duration-300", vm.isDarkMode ? "text-[#dec9cb] hover:text-white" : "text-slate-700 hover:text-[#273043]"].join(" ")} title="Mes favoris">
              <Heart size={17} />
              {vm.favoriteDocuments.length > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#9d0208] px-1 text-[10px] font-semibold text-white">
                  {vm.favoriteDocuments.length > 99 ? "99+" : vm.favoriteDocuments.length}
                </span>
              )}
            </button>

            <button type="button" aria-label={vm.unreadNotificationsCount > 0 ? `Ouvrir les notifications, ${vm.unreadNotificationsCount} non lues` : "Ouvrir les notifications"} onClick={vm.handleOpenNotifications} className={["relative cursor-pointer text-xs font-semibold transition duration-300", vm.isDarkMode ? "text-[#dec9cb] hover:text-white" : "text-slate-700 hover:text-[#273043]"].join(" ")} title="Notifications">
              <BellRing size={16} />
              {vm.unreadNotificationsCount > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#9d0208] px-1 text-[10px] font-semibold text-white">
                  {vm.unreadNotificationsCount > 99 ? "99+" : vm.unreadNotificationsCount}
                </span>
              )}
            </button>

            <button type="button" aria-label="Se deconnecter" onClick={() => void logout()} className={["cursor-pointer px-4 py-2 text-xs font-semibold transition duration-300", vm.isDarkMode ? "text-[#dec9cb] hover:text-white" : "text-slate-700 hover:border-[#273043] hover:text-[#273043]"].join(" ")}>
              <LogOut size={14} />
            </button>

            <button type="button" onClick={() => vm.setIsDarkMode((c) => !c)} aria-label={vm.isDarkMode ? "Activer le mode clair" : "Activer le mode sombre"} title={vm.isDarkMode ? "Mode clair" : "Mode sombre"} className={["relative inline-flex h-10 w-[92px] items-center rounded-xl border p-1 transition-all duration-300", vm.isDarkMode ? "border-[#334155] bg-[#1e293b]" : "border-[#f1e2df] bg-[#fff7f6]"].join(" ")}>
              <span className={["absolute flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(15,23,42,0.12)] transition-transform duration-300", vm.isDarkMode ? "translate-x-[48px]" : "translate-x-0"].join(" ")}>
                {vm.isDarkMode ? <Moon size={16} className="text-[#9d0208]" /> : <Sun size={16} className="text-[#f1b300]" />}
              </span>
              <span className="pointer-events-none flex w-full items-center justify-between px-2">
                <Sun size={18} className={vm.isDarkMode ? "text-[#64748b] opacity-40" : "text-[#9d0208] opacity-100"} />
                <Moon size={18} className={vm.isDarkMode ? "text-[#60a5fa] opacity-90" : "text-[#94a3b8] opacity-35"} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className={isChatPage ? "px-0 py-0" : "w-full"}>
        <Outlet context={outletContext} />
      </main>

      {isHomePage && <HelpCard />}

      <AccessibilityMenu
        highContrastClassName="user-high-contrast"
        highContrastStorageKey={USER_HIGH_CONTRAST_STORAGE_KEY}
        isDarkMode={vm.isDarkMode}
      />

      <RechercheDocumentFavoritesModal
        open={vm.isFavoritesModalOpen}
        items={vm.favoriteDocuments}
        apiBaseUrl={vm.apiBaseUrl}
        onClose={vm.closeFavoritesModal}
        onSelect={(item) => {
          navigate(`/user/documents/recherche?query=${encodeURIComponent(item.title)}&documentId=${encodeURIComponent(item.id)}`);
          vm.closeFavoritesModal();
        }}
        onToggleFavorite={(item) => void vm.toggleFavoriteDocument(item)}
      />

      <UserNotificationsModal
        open={vm.isNotificationsModalOpen}
        items={vm.notifications}
        isLoading={vm.isNotificationsLoading}
        error={vm.notificationsError}
        onClose={vm.closeNotificationsModal}
        onDismiss={vm.handleDismissNotification}
        onMarkAsRead={(notification) => void vm.handleMarkNotificationAsRead(notification)}
      />

      <Snackbar
        open={vm.chatSnackbar.open}
        message={vm.chatSnackbar.message}
        tone="success"
        onClick={vm.chatSnackbar.href ? vm.handleChatSnackbarClick : undefined}
      />
    </div>
  );
}
