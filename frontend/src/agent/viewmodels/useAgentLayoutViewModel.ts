import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { DocumentSearchItem } from "../../models/document";
import type { NotificationItem } from "../../models/notification";
import { fetchGeneratingMessages } from "../../services/chat.service";
import { searchDocuments, setDocumentFavorite } from "../../services/documents.service";
import {
  createNotificationsWebSocket,
  fetchNotifications,
  markNotificationAsRead,
} from "../../services/notifications.service";

const apiBaseUrl              = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const USER_THEME_STORAGE_KEY  = "user-layout-theme";

export function useAgentLayoutViewModel() {
  const { user } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  const [favoriteDocuments, setFavoriteDocuments]             = useState<DocumentSearchItem[]>([]);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen]       = useState(false);
  const [notifications, setNotifications]                     = useState<NotificationItem[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading]   = useState(false);
  const [notificationsError, setNotificationsError]           = useState("");
  const [isDarkMode, setIsDarkMode]                           = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(USER_THEME_STORAGE_KEY) === "dark";
  });
  const [isHeaderScrolled, setIsHeaderScrolled]               = useState(false);
  const [chatSnackbar, setChatSnackbar]                       = useState<{ open: boolean; message: string; href?: string; tone?: "success" | "error" | "info" }>({ open: false, message: "" });

  const pendingMessagesRef    = useRef<Map<string, string>>(new Map());
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());
  const locationRef           = useRef(location);

  // Garde la route courante accessible aux callbacks de polling.
  useEffect(() => { locationRef.current = location; });

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = "fr";
    document.body.classList.toggle("user-dark-theme", isDarkMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(USER_THEME_STORAGE_KEY, isDarkMode ? "dark" : "light");
    }
    return () => { document.body.classList.remove("user-dark-theme"); };
  }, [isDarkMode]);

  useEffect(() => {
    function updateHeaderState() { setIsHeaderScrolled(window.scrollY > 8); }
    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
    return () => { window.removeEventListener("scroll", updateHeaderState); };
  }, []);

  useEffect(() => {
    if (!chatSnackbar.open) return;
    const timer = window.setTimeout(() => setChatSnackbar((s) => ({ ...s, open: false })), 5000);
    return () => window.clearTimeout(timer);
  }, [chatSnackbar.open, chatSnackbar.message]);

  // Poll for finished background-generated messages
  useEffect(() => {
    if (!user?.id) return;
    const interval = window.setInterval(async () => {
      if (pendingMessagesRef.current.size === 0) return;
      const generating    = await fetchGeneratingMessages();
      const generatingIds = new Set(generating.map((m) => m._id));

      for (const [messageId, conversationId] of pendingMessagesRef.current) {
        if (generatingIds.has(messageId)) continue;
        if (notifiedMessageIdsRef.current.has(messageId)) continue;
        notifiedMessageIdsRef.current.add(messageId);
        pendingMessagesRef.current.delete(messageId);

        const currentPath   = locationRef.current.pathname;
        const currentConvId = new URLSearchParams(locationRef.current.search).get("conversationId");
        const isOnThisConv  = currentPath.startsWith("/user/chat") && currentConvId === conversationId;

        setChatSnackbar({
          open: true,
          message: isOnThisConv
            ? "Réponse générée dans votre discussion."
            : "Une réponse est prête dans votre discussion.",
          href: isOnThisConv ? undefined : `/user/chat?conversationId=${conversationId}`,
        });
      }
    }, 3000);
    return () => window.clearInterval(interval);
  }, [user?.id]);

  const refreshFavoriteDocuments = useCallback(async () => {
    try {
      const response = await searchDocuments({ apiBaseUrl, favoritesOnly: true, sortBy: "recent", limit: 100 });
      setFavoriteDocuments(response.items);
    } catch {
      setFavoriteDocuments([]);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const timer = window.setTimeout(() => { void refreshFavoriteDocuments(); }, 0);
    return () => window.clearTimeout(timer);
  }, [user?.id, refreshFavoriteDocuments]);

  useEffect(() => {
    if (!user?.id) return;
    const timer = window.setTimeout(() => { void refreshNotifications(); }, 0);
    return () => window.clearTimeout(timer);
  }, [user?.id, refreshNotifications]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = createNotificationsWebSocket({
      onNotification: ({ data }) => {
        setNotifications((current) => [data, ...current.filter((item) => item.id !== data.id)].slice(0, 100));
      },
    });
    return () => { socket.close(); };
  }, [user?.id]);

  const toggleFavoriteDocument = useCallback(async (item: DocumentSearchItem) => {
    const nextValue = !item.isFavorite;
    try {
      await setDocumentFavorite({ apiBaseUrl, documentId: item.id, isFavored: nextValue });
      setFavoriteDocuments((current) =>
        nextValue
          ? [{ ...item, isFavorite: true }, ...current.filter((e) => e.id !== item.id)]
          : current.filter((e) => e.id !== item.id),
      );
      return nextValue;
    } catch {
      setChatSnackbar({ open: true, message: "Impossible de mettre a jour le favori.", tone: "error" });
      return item.isFavorite;
    }
  }, []);

  const handleOpenNotifications = useCallback(() => {
    setIsNotificationsModalOpen(true);
    void refreshNotifications();
  }, [refreshNotifications]);

  const handleMarkNotificationAsRead = useCallback(async (notification: NotificationItem) => {
    if (notification.isRead) return;
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
  }, []);

  const handleDismissNotification = useCallback((notificationId: string) => {
    setNotifications((current) => current.filter((item) => item.id !== notificationId));
  }, []);

  const registerGeneratingMessage = useCallback((messageId: string, conversationId: string) => {
    pendingMessagesRef.current.set(messageId, conversationId);
  }, []);

  const handleChatSnackbarClick = useCallback(() => {
    if (chatSnackbar.href) {
      navigate(chatSnackbar.href);
      setChatSnackbar((s) => ({ ...s, open: false }));
    }
  }, [chatSnackbar.href, navigate]);

  const unreadNotificationsCount = notifications.filter((item) => !item.isRead).length;

  return {
    apiBaseUrl,
    favoriteDocuments,
    isFavoritesModalOpen,
    openFavoritesModal:  () => setIsFavoritesModalOpen(true),
    closeFavoritesModal: () => setIsFavoritesModalOpen(false),
    notifications,
    isNotificationsModalOpen,
    isNotificationsLoading,
    notificationsError,
    unreadNotificationsCount,
    isDarkMode,
    setIsDarkMode,
    isHeaderScrolled,
    chatSnackbar,
    closeChatSnackbar:          () => setChatSnackbar((s) => ({ ...s, open: false })),
    handleChatSnackbarClick,
    closeNotificationsModal:    () => setIsNotificationsModalOpen(false),
    handleOpenNotifications,
    handleMarkNotificationAsRead,
    handleDismissNotification,
    toggleFavoriteDocument,
    refreshFavoriteDocuments,
    registerGeneratingMessage,
  };
}
