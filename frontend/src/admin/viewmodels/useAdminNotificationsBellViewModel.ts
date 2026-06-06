import { useCallback, useEffect, useRef, useState } from "react";
import type { NotificationItem } from "../../models/notification";
import {
  createNotificationsWebSocket,
  fetchNotifications,
  markNotificationAsRead,
} from "../../services/notifications.service";

const SNACKBAR_MESSAGES: Record<string, string> = {
  urgent_reclamation: "Nouvelle réclamation urgente reçue.",
  sla_overdue:        "Une réclamation a dépassé son délai SLA.",
  indexation_failed:  "Un document n'a pas pu être indexé.",
};

export function useAdminNotificationsBellViewModel() {
  const [items, setItems]         = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [snackbar, setSnackbar]   = useState({ open: false, message: "" });
  const socketRef                 = useRef<WebSocket | null>(null);

  const unreadCount = items.filter((i) => !i.isRead).length;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const res = await fetchNotifications(30);
        if (!cancelled) setItems(res.items);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur de chargement.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const socket = createNotificationsWebSocket({
      onNotification: (event) => {
        setItems((prev) => [event.data, ...prev]);
        const msg = SNACKBAR_MESSAGES[event.data.type] ?? event.data.title;
        setSnackbar({ open: true, message: msg });
      },
    });
    socketRef.current = socket;
    return () => { socket.close(); };
  }, []);

  const handleMarkAsRead = useCallback(async (item: NotificationItem) => {
    try {
      await markNotificationAsRead(item.id);
      setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, isRead: true } : n));
    } catch {
      // Erreur ignoree: la notification restera visible si la mise a jour echoue.
    }
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const togglePanel  = useCallback(() => setPanelOpen((v) => !v), []);
  const closePanel   = useCallback(() => setPanelOpen(false), []);
  const closeSnackbar = useCallback(() => setSnackbar((s) => ({ ...s, open: false })), []);

  return {
    items,
    isLoading,
    error,
    panelOpen,
    unreadCount,
    snackbar,
    togglePanel,
    closePanel,
    handleMarkAsRead,
    handleDismiss,
    closeSnackbar,
  };
}
