import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import AccessibilityMenu from "../../components/accessibility/AccessibilityMenu";
import AdminSidebar from "../components/sidebar/AdminSidebar";
import Snackbar from "../components/Snackbar";
import { fetchAdminReclamations } from "../../services/admin-reclamation.service";

const ADMIN_THEME_KEY = "admin-layout-theme";
const ADMIN_HIGH_CONTRAST_KEY = "admin-layout-high-contrast";
const REMINDER_POLL_MS = 5 * 60 * 1000;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ADMIN_THEME_KEY) === "dark";
  });

  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  // Messages waiting to be shown after the current one closes
  const queueRef = useRef<string[]>([]);
  const showingRef = useRef(false);

  useEffect(() => {
    window.localStorage.setItem(ADMIN_THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  function dequeueReminder() {
    const next = queueRef.current.shift();
    if (next) {
      showingRef.current = true;
      setReminderMessage(next);
      setReminderOpen(true);
    } else {
      showingRef.current = false;
    }
  }

  function handleCloseReminder() {
    setReminderOpen(false);
    // Small delay so the closing animation finishes before the next one appears
    window.setTimeout(dequeueReminder, 400);
  }

  async function checkUrgentReminders() {
    try {
      const reclamations = await fetchAdminReclamations();
      const now = Date.now();
      const newMessages: string[] = [];

      for (const rec of reclamations) {
        if (rec.priority !== "URGENT" || rec.status !== "PENDING") continue;
        const hoursSince = Math.floor((now - new Date(rec.createdAt).getTime()) / (60 * 60 * 1000));
        if (hoursSince <= 0) continue;
        const key = `sla_reminder_${rec.ticketNumber}_h${hoursSince}`;
        if (!window.localStorage.getItem(key)) {
          window.localStorage.setItem(key, "1");
          newMessages.push(
            `Rappel: la reclamation urgente ${rec.ticketNumber} est toujours en attente de prise en charge.`,
          );
        }
      }

      if (newMessages.length === 0) return;
      queueRef.current = [...queueRef.current, ...newMessages];
      if (!showingRef.current) dequeueReminder();
    } catch {
      // Silent — reminder errors must never block the layout
    }
  }

  useEffect(() => {
    void checkUrgentReminders();
    const interval = window.setInterval(() => { void checkUrgentReminders(); }, REMINDER_POLL_MS);
    return () => window.clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={[
        "admin-theme-root grid h-screen",
        dark ? "admin-dark-theme" : "",
        collapsed ? "admin-sidebar-collapsed" : "admin-sidebar-expanded",
      ].filter(Boolean).join(" ")}
      style={{ gridTemplateColumns: collapsed ? "78px 1fr" : "225px 1fr" }}
    >
      <AdminSidebar
        isCollapsed={collapsed}
        isDarkMode={dark}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onToggleDarkMode={() => setDark((d) => !d)}
      />
      <main className="overflow-auto p-4">
        <Outlet />
      </main>

      <AccessibilityMenu
        highContrastClassName="admin-high-contrast"
        highContrastStorageKey={ADMIN_HIGH_CONTRAST_KEY}
        isDarkMode={dark}
      />

      <Snackbar
        open={reminderOpen}
        message={reminderMessage}
        tone="info"
        duration={6000}
        onClose={handleCloseReminder}
      />
    </div>
  );
}
