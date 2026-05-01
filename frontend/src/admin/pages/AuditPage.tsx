import { useEffect, useMemo, useState } from "react";

import AuditActivitiesTable from "../components/audit/AuditActivitiesTable";
import AuditChart from "../components/audit/AuditChart";
import AuditDetailPanel from "../components/audit/AuditDetailPanel";
import AuditFiltersBar from "../components/audit/AuditFiltersBar";
import AuditHeader from "../components/audit/AuditHeader";
import AuditPagination from "../components/audit/AuditPagination";
import AuditRecentActivityList from "../components/audit/AuditRecentActivityList";
import AuditStatsGrid from "../components/audit/AuditStatsGrid";
import AdminPageShell from "../components/layout/AdminPageShell";
import type { AuditActivitiesPayload, AuditStats, AuditTrendPoint } from "../../models/audit";
import { fetchAuditActivities } from "../../services/audit.service";

const PAGE_SIZE = 8;

const emptyPayload: AuditActivitiesPayload = {
  items: [],
  total: 0,
  stats: {
    total: 0,
    uniqueUsers: 0,
    authActivities: 0,
    reclamationActivities: 0,
    last24Hours: 0,
  },
  trend: [],
  users: [],
  actionTypes: [],
};

export default function AuditPage() {
  const [payload, setPayload] = useState<AuditActivitiesPayload>(emptyPayload);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Audit | CIMF";
    void loadAudit();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, userFilter, actionFilter]);

  async function loadAudit() {
    try {
      setIsLoading(true);
      setError("");
      const data = await fetchAuditActivities();
      setPayload(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les activites.");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredActivities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return payload.items.filter((item) => {
      const matchesUser = userFilter === "ALL" || item.userId === userFilter;
      const matchesAction = actionFilter === "ALL" || item.actionType === actionFilter;
      const haystack = [
        item.summary,
        item.userName,
        item.userEmail,
        item.actionLabel,
        item.entityLabel,
        ...Object.values(item.metadata).map((value) => String(value ?? "")),
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
      return matchesUser && matchesAction && matchesSearch;
    });
  }, [actionFilter, payload.items, search, userFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedActivities = useMemo(
    () => filteredActivities.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE),
    [filteredActivities, safeCurrentPage],
  );

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, safeCurrentPage - 1);
    const end = Math.min(totalPages, start + 2);
    const numbers: number[] = [];
    for (let page = Math.max(1, end - 2); page <= end; page += 1) {
      numbers.push(page);
    }
    return numbers;
  }, [safeCurrentPage, totalPages]);

  const selectedActivity = useMemo(
    () => filteredActivities.find((item) => item.id === selectedActivityId) ?? payload.items.find((item) => item.id === selectedActivityId) ?? null,
    [filteredActivities, payload.items, selectedActivityId],
  );

  const filteredStats = useMemo<AuditStats>(() => {
    const uniqueUsers = new Set(filteredActivities.map((item) => item.userId).filter(Boolean)).size;
    return {
      total: filteredActivities.length,
      uniqueUsers,
      authActivities: filteredActivities.filter((item) => item.category === "Authentification").length,
      reclamationActivities: filteredActivities.filter((item) => item.category === "Reclamations").length,
      last24Hours: filteredActivities.filter((item) => {
        const time = new Date(item.occurredAt).getTime();
        return Number.isFinite(time) && time >= Date.now() - 24 * 60 * 60 * 1000;
      }).length,
    };
  }, [filteredActivities]);

  const filteredTrend = useMemo<AuditTrendPoint[]>(() => {
    const buckets = new Map(payload.trend.map((point) => [point.date, { ...point, count: 0 }]));
    filteredActivities.forEach((item) => {
      const key = item.occurredAt.slice(0, 10);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.count += 1;
      }
    });
    return Array.from(buckets.values());
  }, [filteredActivities, payload.trend]);

  const recentActivities = useMemo(() => filteredActivities.slice(0, 5), [filteredActivities]);
  const exportPrefix = userFilter === "ALL" ? "audit-activites" : "audit-activites-user";

  return (
    <>
      <AdminPageShell>
          <AuditHeader />

          <section className="px-5 pb-5 md:px-6">
            <div className="space-y-5">
              <AuditStatsGrid stats={filteredStats} />

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_380px]">
                <AuditChart trend={filteredTrend} />
                <AuditRecentActivityList items={recentActivities} />
              </div>

              <div className="min-h-0 rounded-2xl border border-[#eadfdd] bg-white shadow-sm">
                <AuditFiltersBar
                  search={search}
                  userFilter={userFilter}
                  actionFilter={actionFilter}
                  users={payload.users}
                  actionTypes={payload.actionTypes}
                  filteredActivities={filteredActivities}
                  exportPrefix={exportPrefix}
                  onSearchChange={setSearch}
                  onUserFilterChange={setUserFilter}
                  onActionFilterChange={setActionFilter}
                />

                <AuditActivitiesTable
                  isLoading={isLoading}
                  error={error}
                  filteredActivitiesCount={filteredActivities.length}
                  paginatedActivities={paginatedActivities}
                  onSelectActivity={setSelectedActivityId}
                />

                <AuditPagination
                  safeCurrentPage={safeCurrentPage}
                  totalPages={totalPages}
                  pageNumbers={pageNumbers}
                  filteredCount={filteredActivities.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          </section>
      </AdminPageShell>

      <AuditDetailPanel activity={selectedActivity} onClose={() => setSelectedActivityId(null)} />
    </>
  );
}
