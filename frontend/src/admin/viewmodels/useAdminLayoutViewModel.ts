import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdminReclamations } from "../../services/admin-reclamation.service";

const ADMIN_THEME_KEY        = "admin-layout-theme";
const REMINDER_POLL_MS       = 5 * 60 * 1000;

export function useAdminLayoutViewModel() {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ADMIN_THEME_KEY) === "dark";
  });
  const [reminderOpen, setReminderOpen]       = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const queueRef    = useRef<string[]>([]);
  const showingRef  = useRef(false);

  useEffect(() => {
    window.localStorage.setItem(ADMIN_THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  const dequeueReminder = useCallback(() => {
    const next = queueRef.current.shift();
    if (next) {
      showingRef.current = true;
      setReminderMessage(next);
      setReminderOpen(true);
    } else {
      showingRef.current = false;
    }
  }, []);

  const handleCloseReminder = useCallback(() => {
    setReminderOpen(false);
    window.setTimeout(dequeueReminder, 400);
  }, [dequeueReminder]);

  const checkUrgentReminders = useCallback(async () => {
    try {
      const reclamations = await fetchAdminReclamations();
      const now = Date.now();
      const newMessages: string[] = [];

      for (const rec of reclamations) {
        if (rec.priority !== "URGENT" || rec.status !== "PENDING") continue;
        const hoursSince = Math.floor((now - new Date(rec.createdAt).getTime()) / (60 * 60 * 1000));
        if (hoursSince <= 0) continue;
        const key = `sla_reminder_${rec.referenceNumber}_h${hoursSince}`;
        if (!window.localStorage.getItem(key)) {
          window.localStorage.setItem(key, "1");
          newMessages.push(
            `Rappel: la reclamation urgente ${rec.referenceNumber} est toujours en attente de prise en charge.`,
          );
        }
      }

      if (newMessages.length === 0) return;
      queueRef.current = [...queueRef.current, ...newMessages];
      if (!showingRef.current) dequeueReminder();
    } catch {
      // Erreur ignoree: les rappels ne doivent jamais bloquer le layout.
    }
  }, [dequeueReminder]);

  useEffect(() => {
    void checkUrgentReminders();
    const interval = window.setInterval(() => { void checkUrgentReminders(); }, REMINDER_POLL_MS);
    return () => window.clearInterval(interval);
  }, [checkUrgentReminders]);

  return {
    collapsed,
    setCollapsed,
    dark,
    setDark,
    reminderOpen,
    reminderMessage,
    handleCloseReminder,
  };
}
