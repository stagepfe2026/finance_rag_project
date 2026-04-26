import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  Ellipsis,
  FileText,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { AuditActivity, AuditActivitiesPayload, AuditStats, AuditTrendPoint } from "../../models/audit";
import { fetchAuditActivities } from "../../services/audit.service";
import AdminSidebar from "../components/layout/AdminSidebar";
import { exportAuditToExcel, exportAuditToJson, exportAuditToPdf } from "../utils/auditExports";

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

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function getRoleLabel(role: string) {
  return role === "ADMIN" ? "Admin" : role === "FINANCE_USER" ? "Utilisateur" : role || "-";
}

function getCategoryClassName(category: string) {
  return category === "Authentification"
    ? "border-[#ead9d6] bg-[#fbf6f5] text-[#8a4b4b]"
    : "border-[#f2d6d4] bg-[#fff4f3] text-[#c43d3d]";
}

function getActionClassName(actionType: string) {
  if (actionType.includes("LOGIN")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (actionType.includes("LOGOUT") || actionType.includes("SESSION")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (actionType.includes("DELETED")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-[#f0d9d7] bg-[#fff6f5] text-[#c43d3d]";
}

function buildSmoothLinePath(points: AuditTrendPoint[]) {
  if (points.length === 0) {
    return "";
  }

  const maxCount = Math.max(...points.map((point) => point.count), 1);
  const coordinates = points.map((point, index) => ({
    x: (index / Math.max(points.length - 1, 1)) * 100,
    y: 100 - (point.count / maxCount) * 82 - 8,
  }));

  if (coordinates.length === 1) {
    return `M ${coordinates[0].x} ${coordinates[0].y}`;
  }

  let path = `M ${coordinates[0].x} ${coordinates[0].y}`;
  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const current = coordinates[index];
    const next = coordinates[index + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function buildActivityPayload(activity: AuditActivity) {
  return JSON.stringify(
    {
      action: activity.actionType,
      status: activity.actionLabel,
      level: activity.category === "Authentification" ? "INFO" : "BUSINESS",
      details: {
        message: activity.summary,
        entityType: activity.entityType,
        entityLabel: activity.entityLabel,
      },
      user: {
        id: activity.userId,
        name: activity.userName,
        email: activity.userEmail,
        role: activity.userRole,
      },
      metadata: activity.metadata,
      occurredAt: activity.occurredAt,
    },
    null,
    2,
  );
}

function ExportMenu({
  activities,
  prefix,
}: {
  activities: AuditActivity[];
  prefix: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  function handleExport(exportAction: () => void) {
    exportAction();
    setIsOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-white transition ${
          isOpen
            ? "border-[#cf2027] text-[#cf2027] shadow-[0_10px_24px_rgba(207,32,39,0.14)]"
            : "border-[#e3d8d5] text-[#6d605d] hover:border-[#cf2027] hover:text-[#cf2027]"
        }`}
      >
        <Ellipsis size={18} />
      </button>

      <div
        role="menu"
        className={`absolute right-0 top-[calc(100%+8px)] z-50 w-48 origin-top-right rounded-2xl border border-[#eadfdd] bg-white p-2 shadow-[0_20px_60px_rgba(47,28,28,0.14)] transition duration-150 ${
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => handleExport(() => exportAuditToJson(activities, prefix))}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-[#443b39] transition hover:bg-[#fff4f3] hover:text-[#cf2027]"
        >
          JSON
          <span className="text-[11px] text-[#9a8b87]">.json</span>
        </button>
        <button
          type="button"
          onClick={() => handleExport(() => exportAuditToExcel(activities, prefix))}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-[#443b39] transition hover:bg-[#fff4f3] hover:text-[#cf2027]"
        >
          Excel
          <span className="text-[11px] text-[#9a8b87]">.xlsx</span>
        </button>
        <button
          type="button"
          onClick={() => handleExport(() => exportAuditToPdf(activities, prefix))}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-[#443b39] transition hover:bg-[#fff4f3] hover:text-[#cf2027]"
        >
          PDF
          <span className="text-[11px] text-[#9a8b87]">.pdf</span>
        </button>
      </div>
    </div>
  );
}

function StatsCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border border-[#eadfdd] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#a08f8c]">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff3f2] text-[#cf2027]">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 text-[28px] font-semibold tracking-tight text-[#211f1f]">{value}</p>
    </div>
  );
}

function AuditChart({ trend }: { trend: AuditTrendPoint[] }) {
  const linePath = useMemo(() => buildSmoothLinePath(trend), [trend]);
  const maxCount = useMemo(() => Math.max(...trend.map((point) => point.count), 1), [trend]);

  return (
    <div className="rounded-2xl border border-[#eadfdd] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#a08f8c]">Courbe</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[#211f1f]">Activite des 7 derniers jours</h2>
        </div>
        <span className="inline-flex h-8 items-center rounded-full border border-[#f0dfdd] bg-[#fff8f7] px-3 text-xs font-semibold text-[#c43d3d]">
          Pic {maxCount}
        </span>
      </div>

      <div className="mt-5">
        {trend.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#eadfdd] bg-[#fbf8f7] px-4 py-10 text-center text-sm text-[#857977]">
            Aucune activite recente a afficher.
          </div>
        ) : (
          <div>
            <div className="h-[200px] rounded-2xl border border-[#f1e7e5] bg-[#fffdfc] px-4 py-5">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                {[20, 40, 60, 80].map((line) => (
                  <line key={line} x1="0" y1={line} x2="100" y2={line} stroke="#f0e7e5" strokeWidth="0.45" />
                ))}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#cf2027"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                {trend.map((point, index) => {
                  const x = (index / Math.max(trend.length - 1, 1)) * 100;
                  const y = 100 - (point.count / maxCount) * 82 - 8;
                  return (
                    <circle
                      key={point.date}
                      cx={x}
                      cy={y}
                      r="1.15"
                      fill="#cf2027"
                      stroke="#ffffff"
                      strokeWidth="0.9"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>
            </div>

            <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(52px,1fr))] gap-1.5 text-center text-[11px] text-[#7e7371]">
              {trend.map((point) => (
                <div key={point.date} className="rounded-lg px-1.5 py-1.5 transition hover:bg-[#fbf6f5]">
                  <p className="truncate font-medium text-[#605654]">{point.label}</p>
                  <p className="mt-0.5 text-[10px] text-[#bf4c4c]">{point.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RecentActivityList({ items }: { items: AuditActivity[] }) {
  return (
    <div className="rounded-2xl border border-[#eadfdd] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#a08f8c]">Dernieres activites</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[#211f1f]">Flux recent</h2>
        </div>
        <span className="rounded-xl border border-[#f0dfdd] bg-[#fff7f6] px-3 py-2 text-[12px] font-semibold text-[#c43d3d]">
          {items.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#eadfdd] bg-[#fbf8f7] px-4 py-6 text-sm text-[#857977]">
            Aucune activite recente.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#efe4e1] bg-[#fcf9f8] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#222020]">{item.summary}</p>
                  <p className="mt-1 text-[12px] text-[#827674]">
                    {item.userName || item.userEmail || "Utilisateur"} • {formatDateTime(item.occurredAt)}
                  </p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getActionClassName(item.actionType)}`}>
                  {item.actionLabel}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AuditDetailPanel({
  activity,
  onClose,
}: {
  activity: AuditActivity | null;
  onClose: () => void;
}) {
  if (!activity) {
    return null;
  }

  const payloadJson = buildActivityPayload(activity);

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-[min(100vw,480px)] flex-col border-l border-[#eadfdd] bg-white shadow-[-18px_0_50px_rgba(47,28,28,0.14)]">
      <div className="flex items-start justify-between gap-4 border-b border-[#efe4e1] px-5 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c95050]">Inspection</p>
          <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[#1f1c1c]">Details du log</h2>
          <p className="mt-1 text-[13px] text-[#8a7d7a]">Consultation laterale sans quitter la liste.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e8dcda] bg-[#fbf8f7] text-[#7f7270] transition hover:border-[#cf2027] hover:text-[#cf2027]"
        >
          <X size={17} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#efe4e1] bg-[#fcf8f7] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6a5f5d]">{activity.actionType}</p>
                <p className="mt-2 text-base font-semibold text-[#201d1d]">{activity.actionLabel}</p>
                <p className="mt-1 text-sm text-[#807370]">
                  {activity.category} | {formatDateTime(activity.occurredAt)}
                </p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getActionClassName(activity.actionType)}`}>
                {activity.actionLabel}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#efe4e1] bg-white p-4">
            <h3 className="text-base font-semibold text-[#201d1d]">Utilisateur</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="text-[12px] text-[#958885]">Identifiant</span>
                <p className="mt-1 break-words font-medium text-[#201d1d]">{activity.userEmail || activity.userId || "-"}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#958885]">Nom</span>
                <p className="mt-1 font-medium text-[#201d1d]">{activity.userName || "-"}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#958885]">Role</span>
                <p className="mt-1 font-medium text-[#201d1d]">{getRoleLabel(activity.userRole)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#efe4e1] bg-white p-4">
            <h3 className="text-base font-semibold text-[#201d1d]">Evenement</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="text-[12px] text-[#958885]">Ressource</span>
                <p className="mt-1 font-medium text-[#201d1d]">{activity.entityType.toLowerCase()}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#958885]">Element</span>
                <p className="mt-1 break-words font-medium text-[#201d1d]">{activity.entityLabel}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#958885]">Date complete</span>
                <p className="mt-1 font-medium text-[#201d1d]">{formatDateTime(activity.occurredAt)}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#958885]">Resume</span>
                <p className="mt-1 break-words font-medium text-[#201d1d]">{activity.summary}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#958885]">Categorie</span>
                <p className="mt-2">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getCategoryClassName(activity.category)}`}>
                    {activity.category}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#efe4e1] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#201d1d]">Payload JSON</h3>
                <p className="mt-1 text-sm text-[#8a7d7a]">Exporter cette activite.</p>
              </div>
              <div className="flex items-center gap-2">
                <Download size={15} className="text-[#cf2027]" />
                <ExportMenu activities={[activity]} prefix={`audit-activite-${activity.entityLabel}`} />
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl bg-[#10131c]">
              <pre className="max-h-[280px] overflow-auto p-4 text-[12px] leading-6 text-[#a9f0cc]">
                <code>{payloadJson}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

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
    <div className="h-screen overflow-hidden bg-[#f6f3f2] text-[#111111]">
      <div className="flex h-full overflow-hidden">
        <AdminSidebar />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="border-b border-[#ede4e2] bg-[#fbf8f7] px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#ae9b98]">Administration</p>
                <h1 className="mt-1 text-[24px] font-semibold tracking-tight text-[#1f1c1c]">
                  Audit <span className="text-[#cf2027]">des activites</span>
                </h1>
                <p className="mt-2 max-w-2xl text-[13px] text-[#7f7270]">
                  Suivi des actions utilisateurs, detail au clic, export filtre par utilisateur et historique pagine.
                </p>
              </div>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <StatsCard label="Total activites" value={filteredStats.total} icon={Activity} />
                <StatsCard label="Utilisateurs" value={filteredStats.uniqueUsers} icon={UserRound} />
                <StatsCard label="Auth" value={filteredStats.authActivities} icon={ShieldCheck} />
                <StatsCard label="Reclamations" value={filteredStats.reclamationActivities} icon={FileText} />
                <StatsCard label="Dernieres 24h" value={filteredStats.last24Hours} icon={Download} />
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_380px]">
                <AuditChart trend={filteredTrend} />
                <RecentActivityList items={recentActivities} />
              </div>

              <div className="min-h-0 rounded-2xl border border-[#eadfdd] bg-white shadow-sm">
                <div className="flex flex-wrap items-center gap-3 border-b border-[#efe4e1] px-5 py-4">
                  <div className="flex h-11 min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-[#e3d8d5] bg-[#faf7f6] px-3">
                    <Search size={15} className="text-[#9f8f8c]" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Rechercher une activite, un ticket ou un utilisateur ..."
                      className="w-full bg-transparent text-sm text-[#201d1d] outline-none placeholder:text-[#ad9d9a]"
                    />
                  </div>

                  <select
                    value={userFilter}
                    onChange={(event) => setUserFilter(event.target.value)}
                    className="h-11 rounded-xl border border-[#e3d8d5] bg-white px-3 text-sm text-[#4b4341] outline-none transition focus:border-[#cf2027]"
                  >
                    <option value="ALL">Tous les utilisateurs</option>
                    {payload.users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={actionFilter}
                    onChange={(event) => setActionFilter(event.target.value)}
                    className="h-11 rounded-xl border border-[#e3d8d5] bg-white px-3 text-sm text-[#4b4341] outline-none transition focus:border-[#cf2027]"
                  >
                    <option value="ALL">Tous les types</option>
                    {payload.actionTypes.map((action) => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>

                  <div className="ml-auto flex items-center gap-3">
                    <div className="hidden text-right md:block">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#a08f8c]">Export</p>
                      <p className="mt-1 text-[12px] text-[#6d6260]">
                        {userFilter === "ALL" ? "Filtre courant" : "Activites du user selectionne"}
                      </p>
                    </div>
                    <ExportMenu activities={filteredActivities} prefix={exportPrefix} />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="px-5 py-10 text-sm text-[#7f7270]">Chargement des activites...</div>
                  ) : error ? (
                    <div className="px-5 py-10 text-sm text-[#c43d3d]">{error}</div>
                  ) : filteredActivities.length === 0 ? (
                    <div className="px-5 py-10 text-sm text-[#7f7270]">Aucune activite ne correspond aux filtres.</div>
                  ) : (
                    <table className="min-w-full text-left">
                      <thead className="bg-[#faf7f6] text-[11px] uppercase tracking-[0.1em] text-[#998b88]">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Utilisateur</th>
                          <th className="px-5 py-3 font-semibold">Action</th>
                          <th className="px-5 py-3 font-semibold">Element</th>
                          <th className="px-5 py-3 font-semibold">Categorie</th>
                          <th className="px-5 py-3 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedActivities.map((activity) => (
                          <tr
                            key={activity.id}
                            onClick={() => setSelectedActivityId(activity.id)}
                            className="cursor-pointer border-t border-[#f2e9e6] transition hover:bg-[#fff5f4]"
                          >
                            <td className="px-5 py-4">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#231f1f]">
                                  {activity.userName || "Utilisateur"}
                                </p>
                                <p className="mt-1 truncate text-[12px] text-[#857977]">{activity.userEmail || "-"}</p>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getActionClassName(activity.actionType)}`}>
                                {activity.actionLabel}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#2b2726]">{activity.entityLabel}</p>
                                <p className="mt-1 truncate text-[12px] text-[#857977]">{activity.summary}</p>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getCategoryClassName(activity.category)}`}>
                                {activity.category}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm text-[#5e5452]">{formatDateTime(activity.occurredAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#efe4e1] px-5 py-4">
                  <p className="text-sm text-[#7b706d]">
                    {(safeCurrentPage - 1) * PAGE_SIZE + 1}-{Math.min(safeCurrentPage * PAGE_SIZE, filteredActivities.length)} sur {filteredActivities.length} activites
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                      disabled={safeCurrentPage === 1}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e3d8d5] bg-white px-3 text-sm text-[#5c5250] transition hover:border-[#cf2027] hover:text-[#cf2027] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <ChevronLeft size={14} />
                      Precedent
                    </button>

                    {pageNumbers.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                          page === safeCurrentPage
                            ? "border-[#cf2027] bg-[#cf2027] text-white"
                            : "border-[#e3d8d5] bg-white text-[#5c5250] hover:border-[#cf2027] hover:text-[#cf2027]"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e3d8d5] bg-white px-3 text-sm text-[#5c5250] transition hover:border-[#cf2027] hover:text-[#cf2027] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Suivant
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <AuditDetailPanel activity={selectedActivity} onClose={() => setSelectedActivityId(null)} />
    </div>
  );
}
