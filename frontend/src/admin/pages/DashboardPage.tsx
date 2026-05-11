import { useEffect, useMemo, useState } from "react";

import DashboardDonutCard           from "../components/dashboard/DashboardDonutCard";
import DashboardHeader              from "../components/dashboard/DashboardHeader";
import DashboardRecentDocumentsTable from "../components/dashboard/DashboardRecentDocumentsTable";
import DashboardSummaryCards        from "../components/dashboard/DashboardSummaryCards";
import DashboardTrendCard           from "../components/dashboard/DashboardTrendCard";
import DashboardUrgentCasesCard     from "../components/dashboard/DashboardUrgentCasesCard";
import type { AdminDashboard }      from "../../models/admin-dashboard";
import { fetchAdminDashboard }      from "../../services/admin-dashboard.service";

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
function toDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function subtractDays(s: string, n: number) {
  const d = new Date(`${s}T00:00:00`);
  d.setDate(d.getDate() - n);
  return toDateInput(d);
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
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

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <DashboardHeader
        urgentCasesCount={dashboard.summary.reclamationsUrgent}
        pendingReclamationsCount={dashboard.summary.pendingReclamations}
        trend={dashboard.trend}
        statsStartDate={startDate}
        statsEndDate={endDate}
        onStatsStartDateChange={setStartDate}
        onUseLastMonth={() => setStartDate(subtractDays(endDate, 30))}
      />

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <main className="px-2 py-1 space-y-4">

        {/* Error */}
        {error && (
          <div className="rounded border border-[#f3c6cc] bg-[#f5e6e7] px-2 py-2.5 text-sm text-[#9d0208]">
            {error}
          </div>
        )}

        {/* KPI row */}
        <DashboardSummaryCards summary={dashboard.summary} />

        {/* Main grid: 2/3 left · 1/3 right */}
        <div className="grid gap-4 lg:grid-cols-[1fr_310px] xl:grid-cols-[1fr_340px]">

          {/* Left column */}
          <div className="space-y-4 min-w-0">
            <DashboardTrendCard trend={filteredTrend} isLoading={loading} />
            <DashboardRecentDocumentsTable documents={dashboard.recentIndexedDocuments} />
          </div>

          {/* Right column */}
          <div className="space-y-4 min-w-0">
           
            <DashboardUrgentCasesCard items={dashboard.urgentCases} />

          <DashboardDonutCard
            title="Réclamations"
            items={[
              { label: "En attente", value: dashboard.reclamationBreakdown.pending,    color: "#ef4444" }, // red
              { label: "En cours",   value: dashboard.reclamationBreakdown.inProgress, color: "#991b1b" }, // dark red
              { label: "Traitées",   value: dashboard.reclamationBreakdown.resolved,   color: "#6b7280" }, // gray
              { label: "Urgentes",   value: dashboard.reclamationBreakdown.urgent,     color: "#2563eb" }, // blue
            ]}
          />

           <DashboardDonutCard
          title="Documents"
          items={[
            { label: "Indexés",  value: dashboard.documentBreakdown.indexed,    color: "#111827" }, // black
            { label: "En cours", value: dashboard.documentBreakdown.processing, color: "#ef4444" }, // red
            { label: "Échoués",  value: dashboard.documentBreakdown.failed,     color: "#6b7280" }, // gray
          ]}
          />

          </div>
        </div>
      </main>
    </div>
  );
}
