import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NotificationItem } from "../../../models/notification";
import {
  createNotificationsWebSocket,
  fetchNotifications,
  markNotificationAsRead,
} from "../../../services/notifications.service";
import Snackbar from "../Snackbar";
import AdminNotificationsPanel from "./AdminNotificationsPanel";

const SNACKBAR_MESSAGES: Record<string, string> = {
  urgent_reclamation: "Nouvelle réclamation urgente reçue.",
  sla_overdue:        "Une réclamation a dépassé son délai SLA.",
  indexation_failed:  "Un document n'a pas pu être indexé.",
};

type Props = {
  isCollapsed: boolean;
};

export default function AdminNotificationsBell({ isCollapsed }: Props) {
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
      // silent
    }
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        aria-label="Notifications"
        className={[
          "relative flex h-8 items-center  rounded-md text-[11px] font-medium cursor-pointer transition-all duration-200",
          isCollapsed ? "w-8 justify-center" : "gap-1.5 px-2",
          "text-[#5f6680] hover:bg-[#f7f9fc] hover:text-[#071f3d]",
        ].join(" ")}
      >
        <Bell size={14} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9d0208] px-0.5 text-[9px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {!isCollapsed && "Notifications"}
      </button>

      <AdminNotificationsPanel
        open={panelOpen}
        items={items}
        isLoading={isLoading}
        error={error}
        onClose={() => setPanelOpen(false)}
        onMarkAsRead={(item) => void handleMarkAsRead(item)}
        onDismiss={handleDismiss}
      />

      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        tone="info"
        duration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
    </>
  );
}
