import { useDashboardViewModel } from "../viewmodels/useDashboardViewModel";
import DashboardDonutCard from "../components/dashboard/DashboardDonutCard";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardRecentDocumentsTable from "../components/dashboard/DashboardRecentDocumentsTable";
import DashboardSummaryCards from "../components/dashboard/DashboardSummaryCards";
import DashboardTrendCard from "../components/dashboard/DashboardTrendCard";
import DashboardUrgentCasesCard from "../components/dashboard/DashboardUrgentCasesCard";

export default function DashboardPage() {
  const vm = useDashboardViewModel();
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <DashboardHeader
        urgentCasesCount={vm.dashboard.summary.reclamationsUrgent}
        pendingReclamationsCount={vm.dashboard.summary.pendingReclamations}
        trend={vm.dashboard.trend}
        statsStartDate={vm.startDate}
        statsEndDate={vm.endDate}
        onStatsStartDateChange={vm.setStartDate}
        onUseLastMonth={() => vm.setStartDate(vm.subtractDays(vm.endDate, 30))}
      />
      <main className="px-2 py-1 space-y-4">
        {vm.error && (
          <div className="rounded border border-[#f3c6cc] bg-[#f5e6e7] px-2 py-2.5 text-sm text-[#9d0208]">
            {vm.error}
          </div>
        )}
        <DashboardSummaryCards summary={vm.dashboard.summary} />
        <div className="grid gap-4 lg:grid-cols-[1fr_310px] xl:grid-cols-[1fr_340px]">
          <div className="space-y-4 min-w-0">
            <DashboardTrendCard trend={vm.filteredTrend} isLoading={vm.loading} />
            <DashboardRecentDocumentsTable documents={vm.dashboard.recentIndexedDocuments} />
          </div>
          <div className="space-y-4 min-w-0">
            <DashboardUrgentCasesCard items={vm.dashboard.urgentCases} />
            <DashboardDonutCard
              title="Réclamations"
              items={[
                { label: "En attente", value: vm.dashboard.reclamationBreakdown.pending, color: "#ef4444" },
                { label: "En cours", value: vm.dashboard.reclamationBreakdown.inProgress, color: "#991b1b" },
                { label: "Traitées", value: vm.dashboard.reclamationBreakdown.resolved, color: "#6b7280" },
                { label: "Urgentes", value: vm.dashboard.reclamationBreakdown.urgent, color: "#2563eb" },
              ]}
            />
            <DashboardDonutCard
              title="Documents"
              items={[
                { label: "Indexés", value: vm.dashboard.documentBreakdown.indexed, color: "#111827" },
                { label: "En cours", value: vm.dashboard.documentBreakdown.processing, color: "#ef4444" },
                { label: "Échoués", value: vm.dashboard.documentBreakdown.failed, color: "#6b7280" },
              ]}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
