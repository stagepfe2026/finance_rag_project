import { useEffect, useMemo, useState } from "react";

import type { AdminDashboard } from "../../models/admin-dashboard";
import { fetchAdminDashboard } from "../../services/admin-dashboard.service";

// ─── Empty state ──────────────────────────────────────────────────────────────
const EMPTY: AdminDashboard = {
  summary: {
    documentsIndexed: 0, documentsTotal: 0,
    reclamationsTotal: 0, reclamationsUrgent: 0,
    activeUsers: 0, pendingReclamations: 0,
  },
  reclamationBreakdown: { pending: 0, inProgress: 0, resolved: 0, urgent: 0 },
  documentBreakdown:    { indexed: 0, processing: 0, failed: 0 },
  trend:                   [],
  recentIndexedDocuments:  [],
  latestAccess:            [],
  urgentCases:             [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function toDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function subtractDays(s: string, n: number) {
  const d = new Date(`${s}T00:00:00`);
  d.setDate(d.getDate() - n);
  return toDateInput(d);
}

// ─── ViewModel ───────────────────────────────────────────────────────────────
export function useDashboardViewModel() {
  const [dashboard, setDashboard] = useState<AdminDashboard>(EMPTY);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [startDate, setStartDate] = useState("");
  const endDate = useMemo(() => toDateInput(new Date()), []);

  useEffect(() => { document.title = "Tableau de bord | Administration"; }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError("");
        const data = await fetchAdminDashboard();
        if (!cancelled) {
          setDashboard(data);
          setStartDate(prev => {
            if (prev) return prev;
            const d7 = subtractDays(endDate, 6);
            return data.trend.find(p => p.date >= d7)?.date ?? data.trend[0]?.date ?? endDate;
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur de chargement.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [endDate]);

  const filteredTrend = useMemo(
    () => dashboard.trend.filter(p =>
      (!startDate || p.date >= startDate) && p.date <= endDate,
    ),
    [dashboard.trend, startDate, endDate],
  );

  return {
    dashboard,
    loading,
    error,
    startDate,
    endDate,
    filteredTrend,
    setStartDate,
    subtractDays,
  };
}
