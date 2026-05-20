import { useAuditViewModel } from "../viewmodels/useAuditViewModel";
import AuditActivitiesTable from "../components/audit/AuditActivitiesTable";
import AuditChart from "../components/audit/AuditChart";
import AuditDetailPanel from "../components/audit/AuditDetailPanel";
import AuditFiltersBar from "../components/audit/AuditFiltersBar";
import AuditHeader from "../components/audit/AuditHeader";
import AuditPagination from "../components/audit/AuditPagination";
import AuditRecentActivityList from "../components/audit/AuditRecentActivityList";
import AuditStatsGrid from "../components/audit/AuditStatsGrid";

const PAGE_SIZE = 8;

export default function AuditPage() {
  const vm = useAuditViewModel();
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <AuditHeader totalActivities={vm.filteredStats.total} last24Hours={vm.filteredStats.last24Hours} />

      <main className="space-y-4 px-2 py-1">
        <AuditStatsGrid stats={vm.filteredStats} />

        <div className="grid gap-4 lg:grid-cols-[1fr_310px] xl:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <AuditChart trend={vm.filteredTrend} />
          </div>

          <div className="min-w-0">
            <AuditRecentActivityList
              items={vm.activitiesBeforeSensitiveFilter}
              activeGroupId={vm.sensitiveGroupFilter}
              onSelectGroup={vm.handleSensitiveGroupChange}
            />
          </div>
        </div>

        <section className="min-h-0 w-full rounded-lg border border-[#e5eaf2] bg-white">
          <AuditFiltersBar
            search={vm.search}
            userFilter={vm.userFilter}
            actionFilter={vm.actionFilter}
            users={vm.payload.users}
            actionTypes={vm.availableActionTypes}
            filteredActivities={vm.filteredActivities}
            exportPrefix={vm.exportPrefix}
            onSearchChange={vm.setSearch}
            onUserFilterChange={vm.setUserFilter}
            onActionFilterChange={vm.handleActionFilterChange}
            onResetFilters={vm.handleResetFilters}
          />

          <AuditActivitiesTable
            isLoading={vm.isLoading}
            error={vm.error}
            filteredActivitiesCount={vm.filteredActivities.length}
            paginatedActivities={vm.paginatedActivities}
            onSelectActivity={vm.setSelectedActivityId}
          />

          <AuditPagination
            safeCurrentPage={vm.safeCurrentPage}
            totalPages={vm.totalPages}
            pageNumbers={vm.pageNumbers}
            filteredCount={vm.filteredActivities.length}
            pageSize={PAGE_SIZE}
            onPageChange={vm.setCurrentPage}
          />
        </section>
      </main>

      <AuditDetailPanel activity={vm.selectedActivity} onClose={() => vm.setSelectedActivityId(null)} />
    </div>
  );
}
