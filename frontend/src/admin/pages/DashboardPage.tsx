import { useEffect, useMemo, useState } from "react";

import DashboardDonutCard from "../components/dashboard/DashboardDonutCard";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardLatestAccessCard from "../components/dashboard/DashboardLatestAccessCard";
import DashboardRecentDocumentsTable from "../components/dashboard/DashboardRecentDocumentsTable";
import DashboardSummaryCards from "../components/dashboard/DashboardSummaryCards";
import DashboardTrendCard from "../components/dashboard/DashboardTrendCard";
import AdminPageShell from "../components/layout/AdminPageShell";
import type { AdminDashboard } from "../../models/admin-dashboard";
import { fetchAdminDashboard } from "../../services/admin-dashboard.service";

const emptyDashboard: AdminDashboard = {
  summary: {
    documentsIndexed: 0,
    documentsTotal: 0,
    reclamationsTotal: 0,
    reclamationsUrgent: 0,
    activeUsers: 0,
    pendingReclamations: 0,
  },
  reclamationBreakdown: {
    pending: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
  },
  documentBreakdown: {
    indexed: 0,
    processing: 0,
    failed: 0,
  },
  trend: [],
  recentIndexedDocuments: [],
  latestAccess: [],
  urgentCases: [],
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function subtractDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() - days);
  return toDateInputValue(date);
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statsStartDate, setStatsStartDate] = useState("");
  const statsEndDate = useMemo(() => toDateInputValue(new Date()), []);

  useEffect(() => {
    document.title = "Dashboard | CIMF";
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError("");
        const data = await fetchAdminDashboard();
        if (!cancelled) {
          setDashboard(data);
          setStatsStartDate((current) => {
            if (current) return current;
            const defaultStartDate = subtractDays(statsEndDate, 6);
            return data.trend.find((point) => point.date >= defaultStartDate)?.date || data.trend[0]?.date || statsEndDate;
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Erreur pendant le chargement du dashboard admin.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [statsEndDate]);

  const filteredTrend = useMemo(() => {
    if (!statsStartDate) {
      return dashboard.trend;
    }

    return dashboard.trend.filter((point) => point.date >= statsStartDate && point.date <= statsEndDate);
  }, [dashboard.trend, statsEndDate, statsStartDate]);

  return (
    <AdminPageShell>
      <DashboardHeader
        urgentCasesCount={dashboard.summary.reclamationsUrgent}
        pendingReclamationsCount={dashboard.summary.pendingReclamations}
        trend={dashboard.trend}
        statsStartDate={statsStartDate}
        statsEndDate={statsEndDate}
        onStatsStartDateChange={setStatsStartDate}
        onUseLastMonth={() => setStatsStartDate(subtractDays(statsEndDate, 30))}
      />

      <section className="px-5 pb-4 md:px-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <div className="space-y-3">
          <DashboardSummaryCards summary={dashboard.summary} />

          <div className="admin-dashboard-grid grid items-start gap-3">
            <div className="grid min-w-0 gap-3">
              <DashboardTrendCard trend={filteredTrend} isLoading={isLoading} />
              <DashboardRecentDocumentsTable documents={dashboard.recentIndexedDocuments} />
            </div>

            <div className="grid min-w-0 gap-3">
              <DashboardDonutCard
                title="Reclamations"
                items={[
                  { label: "En attente", value: dashboard.reclamationBreakdown.pending, color: "#f06f80", tone: "#f06f80" },
                  { label: "En cours", value: dashboard.reclamationBreakdown.inProgress, color: "#9d0208", tone: "#9d0208" },
                  { label: "Traitees", value: dashboard.reclamationBreakdown.resolved, color: "#8d7f83", tone: "#8d7f83" },
                  { label: "Urgentes", value: dashboard.reclamationBreakdown.urgent, color: "#071f3d", tone: "#071f3d" },
                ]}
              />
              <DashboardDonutCard
                title="Documents"
                items={[
                  { label: "Indexes", value: dashboard.documentBreakdown.indexed, color: "#071f3d", tone: "#071f3d" },
                  { label: "En cours", value: dashboard.documentBreakdown.processing, color: "#f6a6b1", tone: "#f06f80" },
                  { label: "Echoues", value: dashboard.documentBreakdown.failed, color: "#9d0208", tone: "#9d0208" },
                ]}
              />
              <DashboardLatestAccessCard items={dashboard.latestAccess} />
            </div>
          </div>
        </div>
      </section>
    </AdminPageShell>
  );
}
