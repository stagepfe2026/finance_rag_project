import { useEffect, useMemo, useState } from "react";

import AuditActivitiesTable from "../components/audit/AuditActivitiesTable";
import AuditChart from "../components/audit/AuditChart";
import AuditDetailPanel from "../components/audit/AuditDetailPanel";
import AuditFiltersBar from "../components/audit/AuditFiltersBar";
import AuditHeader from "../components/audit/AuditHeader";
import AuditPagination from "../components/audit/AuditPagination";
import AuditRecentActivityList, {
  SENSITIVE_AUDIT_GROUPS,
  type SensitiveAuditGroupId,
} from "../components/audit/AuditRecentActivityList";
import AuditStatsGrid from "../components/audit/AuditStatsGrid";
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
      chatActivities: 0,
      documentSearchActivities: 0,
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
  const [sensitiveGroupFilter, setSensitiveGroupFilter] = useState<SensitiveAuditGroupId | null>(null);
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
  }, [search, userFilter, actionFilter, sensitiveGroupFilter]);

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

  const activitiesBeforeSensitiveFilter = useMemo(() => {
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

  const activeSensitiveGroup = useMemo(
    () => SENSITIVE_AUDIT_GROUPS.find((group) => group.id === sensitiveGroupFilter) ?? null,
    [sensitiveGroupFilter],
  );

  const filteredActivities = useMemo(() => {
    if (!activeSensitiveGroup) {
      return activitiesBeforeSensitiveFilter;
    }
    const activeTypes = new Set(activeSensitiveGroup.types);
    return activitiesBeforeSensitiveFilter.filter((item) => activeTypes.has(item.actionType));
  }, [activeSensitiveGroup, activitiesBeforeSensitiveFilter]);

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
      chatActivities: filteredActivities.filter((item) => item.category === "Chat").length,
      documentSearchActivities: filteredActivities.filter((item) =>
        item.category === "Recherche document" || item.category === "Gestion document",
      ).length,
      last24Hours: filteredActivities.filter((item) => {
        const time = new Date(item.occurredAt).getTime();
        return Number.isFinite(time) && time >= Date.now() - 24 * 60 * 60 * 1000;
      }).length,
    };
  }, [filteredActivities]);

  const filteredTrend = useMemo<AuditTrendPoint[]>(() => {
    const buckets = new Map(
      payload.trend.map((point) => [
        point.date,
        {
          ...point,
          count: 0,
          authentification: 0,
          reclamations: 0,
          chat: 0,
          documentSearch: 0,
        },
      ]),
    );
    filteredActivities.forEach((item) => {
      const key = item.occurredAt.slice(0, 10);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.count += 1;
        if (item.category === "Authentification") {
          bucket.authentification += 1;
        } else if (item.category === "Reclamations") {
          bucket.reclamations += 1;
        } else if (item.category === "Chat") {
          bucket.chat += 1;
        } else if (item.category === "Recherche document" || item.category === "Gestion document") {
          bucket.documentSearch += 1;
        }
      }
    });
    return Array.from(buckets.values());
  }, [filteredActivities, payload.trend]);

  // Action types derived from items matching the current user filter only (not action filter)
  const availableActionTypes = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of payload.items) {
      if (userFilter !== "ALL" && item.userId !== userFilter) continue;
      if (!seen.has(item.actionType)) {
        seen.set(item.actionType, item.actionLabel);
      }
    }
    return Array.from(seen.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [payload.items, userFilter]);

  // Auto-reset actionFilter when the selected type is no longer available
  useEffect(() => {
    if (actionFilter === "ALL") return;
    if (!availableActionTypes.some((t) => t.value === actionFilter)) {
      setActionFilter("ALL");
    }
  }, [availableActionTypes, actionFilter]);

  function handleActionFilterChange(nextAction: string) {
    setActionFilter(nextAction);
    if (nextAction !== "ALL") {
      setSensitiveGroupFilter(null);
    }
  }

  function handleSensitiveGroupChange(nextGroupId: SensitiveAuditGroupId | null) {
    setSensitiveGroupFilter(nextGroupId);
    if (nextGroupId) {
      setActionFilter("ALL");
    }
  }

  function handleResetFilters() {
    setSearch("");
    setUserFilter("ALL");
    setActionFilter("ALL");
    setSensitiveGroupFilter(null);
  }

  const exportPrefix = userFilter === "ALL" ? "audit-activites" : "audit-activites-user";

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <AuditHeader totalActivities={filteredStats.total} last24Hours={filteredStats.last24Hours} />

      <main className="space-y-4 px-2 py-1">
        <AuditStatsGrid stats={filteredStats} />

        <div className="grid gap-4 lg:grid-cols-[1fr_310px] xl:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <AuditChart trend={filteredTrend} />
          </div>

          <div className="min-w-0">
            <AuditRecentActivityList
              items={activitiesBeforeSensitiveFilter}
              activeGroupId={sensitiveGroupFilter}
              onSelectGroup={handleSensitiveGroupChange}
            />
          </div>
        </div>

        <section className="min-h-0 w-full rounded-lg border border-[#e5eaf2] bg-white">
          <AuditFiltersBar
            search={search}
            userFilter={userFilter}
            actionFilter={actionFilter}
            users={payload.users}
            actionTypes={availableActionTypes}
            filteredActivities={filteredActivities}
            exportPrefix={exportPrefix}
            onSearchChange={setSearch}
            onUserFilterChange={setUserFilter}
            onActionFilterChange={handleActionFilterChange}
            onResetFilters={handleResetFilters}
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
        </section>
      </main>

      <AuditDetailPanel activity={selectedActivity} onClose={() => setSelectedActivityId(null)} />
    </div>
  );
}
