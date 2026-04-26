import {
  Activity,
  AlertTriangle,
  Clock3,
  FileBarChart2,
  FileText,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { AdminDashboard, AdminDashboardTrendPoint } from "../../models/admin-dashboard";
import { fetchAdminDashboard } from "../../services/admin-dashboard.service";
import AdminSidebar from "../components/layout/AdminSidebar";

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

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const diffHours = Math.max(1, Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60)));
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `Il y a ${diffDays} j`;
}

function getCategoryLabel(value: string) {
  const labels: Record<string, string> = {
    finance: "Loi Finance",
    legal: "Juridique",
    hr: "RH",
    compliance: "Conformite",
    other: "Autre",
  };
  return labels[value] ?? value;
}

function getStatusLabel(value: string) {
  const labels: Record<string, string> = {
    indexed: "Indexe",
    processing: "En cours",
    failed: "Echoue",
    PENDING: "En attente",
    IN_PROGRESS: "En cours",
    RESOLVED: "Traitee",
  };
  return labels[value] ?? value;
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: typeof FileText;
}) {
  return (
    <div className="rounded-2xl border border-[#eadfdd] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#a5918e]">{title}</p>
          <p className="mt-2 text-[28px] font-semibold tracking-tight text-[#201d1d]">{value}</p>
          <p className="mt-1 text-[12px] text-[#7e7370]">{subtitle}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff3f2] text-[#cf2027]">
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function DonutCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: number; color: string; tone: string }>;
}) {
  const total = Math.max(items.reduce((sum, item) => sum + item.value, 0), 1);
  let currentAngle = -90;
  const segments = items.map((item) => {
    const angle = (item.value / total) * 360;
    const segment = `${item.color} ${currentAngle}deg ${currentAngle + angle}deg`;
    currentAngle += angle;
    return segment;
  });

  return (
    <div className="rounded-2xl border border-[#eadfdd] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#a5918e]">Repartition</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[#201d1d]">{title}</h2>
        </div>
        <div className="rounded-xl border border-[#f0e3e1] bg-[#fff9f8] px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#b59d99]">Total</p>
          <p className="mt-1 text-[18px] font-semibold text-[#201d1d]">{total}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <div
          className="h-36 w-36 shrink-0 rounded-full"
          style={{
            background: `conic-gradient(${segments.join(", ")})`,
          }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full border-[12px] border-transparent">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-center">
              <div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#a5918e]">Total</p>
                <p className="mt-1 text-xl font-semibold text-[#201d1d]">{total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl border border-[#f0e3e1] bg-[#fcf8f7] px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.tone }} />
                <span className="text-sm text-[#3d3534]">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-[#201d1d]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildTrendPath(points: AdminDashboardTrendPoint[], key: "documents" | "reclamations") {
  if (points.length === 0) return "";
  const maxValue = Math.max(...points.map((point) => point[key]), 1);
  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - (point[key] / maxValue) * 100;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, []);

  const documentsPath = useMemo(() => buildTrendPath(dashboard.trend, "documents"), [dashboard.trend]);
  const reclamationsPath = useMemo(() => buildTrendPath(dashboard.trend, "reclamations"), [dashboard.trend]);

  return (
    <div className="h-screen overflow-hidden bg-[#f6f3f2] text-[#111111]">
      <div className="flex h-full overflow-hidden">
        <AdminSidebar />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="border-b border-[#ede4e2] bg-[#fbf8f7] px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#a5918e]">Tableau de bord</p>
                <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[#201d1d]">
                  Vue globale <span className="text-[#cf2027]">administration</span>
                </h1>
                <p className="mt-2 max-w-3xl text-[13px] text-[#7e7370]">
                  Suivez les documents indexes, les reclamations, les cas urgents et les derniers acces utilisateurs dans une vue unique.
                </p>
              </div>
              <div className="rounded-2xl border border-[#ecdedd] bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#a5918e]">Focus prioritaire</p>
                <p className="mt-1 text-lg font-semibold text-[#201d1d]">{dashboard.summary.reclamationsUrgent} cas urgents</p>
                <p className="mt-1 text-[12px] text-[#7e7370]">{dashboard.summary.pendingReclamations} reclamations en attente</p>
              </div>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}

            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  title="Documents indexes"
                  value={dashboard.summary.documentsIndexed}
                  subtitle={`${dashboard.summary.documentsTotal} documents au total`}
                  icon={FileBarChart2}
                />
                <SummaryCard
                  title="Reclamations"
                  value={dashboard.summary.reclamationsTotal}
                  subtitle={`${dashboard.summary.pendingReclamations} en attente`}
                  icon={ShieldAlert}
                />
                <SummaryCard
                  title="Cas urgents"
                  value={dashboard.summary.reclamationsUrgent}
                  subtitle="A prioriser rapidement"
                  icon={AlertTriangle}
                />
                <SummaryCard
                  title="Derniers acces"
                  value={dashboard.summary.activeUsers}
                  subtitle="Utilisateurs actifs recents"
                  icon={Users}
                />
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
                <div className="rounded-2xl border border-[#eadfdd] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#a5918e]">Activite</p>
                      <h2 className="mt-1 text-[20px] font-semibold text-[#201d1d]">Documents et reclamations</h2>
                    </div>
                    <div className="flex gap-2 text-[11px]">
                      <span className="rounded-full border border-[#f1d1cf] bg-[#fff4f3] px-3 py-1 font-semibold text-[#c84242]">
                        Reclamations
                      </span>
                      <span className="rounded-full border border-[#eadfdd] bg-[#fbf8f7] px-3 py-1 font-semibold text-[#6e625f]">
                        Documents
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 h-[280px] rounded-2xl bg-[#fdf8f7] p-4">
                    {isLoading ? (
                      <div className="flex h-full items-center justify-center text-sm text-[#7e7370]">Chargement...</div>
                    ) : (
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                        {[0, 25, 50, 75, 100].map((line) => (
                          <line
                            key={line}
                            x1="0"
                            y1={line}
                            x2="100"
                            y2={line}
                            stroke="#efe1de"
                            strokeDasharray="2 3"
                            strokeWidth="0.5"
                          />
                        ))}
                        <path d={documentsPath} fill="none" stroke="#6e625f" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
                        <path d={reclamationsPath} fill="none" stroke="#cf2027" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
                      </svg>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-7 gap-2 text-center text-[11px] text-[#7e7370]">
                    {dashboard.trend.map((point) => (
                      <div key={point.date} className="rounded-xl bg-[#fbf6f5] px-2 py-2">
                        <p className="font-medium text-[#605654]">{point.label}</p>
                        <p className="mt-1 text-[#6e625f]">Doc {point.documents}</p>
                        <p className="text-[#cf2027]">Rec {point.reclamations}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5">
                  <DonutCard
                    title="Reclamations"
                    items={[
                      { label: "En attente", value: dashboard.reclamationBreakdown.pending, color: "#fef3c7", tone: "#d97706" },
                      { label: "En cours", value: dashboard.reclamationBreakdown.inProgress, color: "#fee2e2", tone: "#ef4444" },
                      { label: "Traitees", value: dashboard.reclamationBreakdown.resolved, color: "#e7f7ef", tone: "#059669" },
                      { label: "Urgentes", value: dashboard.reclamationBreakdown.urgent, color: "#ffe4e6", tone: "#e11d48" },
                    ]}
                  />
                  <DonutCard
                    title="Documents"
                    items={[
                      { label: "Indexes", value: dashboard.documentBreakdown.indexed, color: "#f7e7e5", tone: "#cf2027" },
                      { label: "En cours", value: dashboard.documentBreakdown.processing, color: "#f1ebe9", tone: "#8b7d79" },
                      { label: "Echoues", value: dashboard.documentBreakdown.failed, color: "#fde8e8", tone: "#b91c1c" },
                    ]}
                  />
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
                <div className="rounded-2xl border border-[#eadfdd] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#a5918e]">Documents indexes</p>
                      <h2 className="mt-1 text-[20px] font-semibold text-[#201d1d]">Liste recente</h2>
                    </div>
                    <span className="rounded-xl border border-[#eadfdd] bg-[#fbf8f7] px-3 py-2 text-[12px] font-semibold text-[#6e625f]">
                      {dashboard.recentIndexedDocuments.length} elements
                    </span>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead className="bg-[#faf7f6] text-[11px] uppercase tracking-[0.1em] text-[#998b88]">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Titre</th>
                          <th className="px-4 py-3 font-semibold">Categorie</th>
                          <th className="px-4 py-3 font-semibold">Type</th>
                          <th className="px-4 py-3 font-semibold">Indexation</th>
                          <th className="px-4 py-3 font-semibold">Chunks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.recentIndexedDocuments.length === 0 ? (
                          <tr className="border-t border-[#f2e9e6]">
                            <td colSpan={5} className="px-4 py-6 text-sm text-[#7e7370]">
                              Aucun document indexe recent.
                            </td>
                          </tr>
                        ) : (
                          dashboard.recentIndexedDocuments.map((document) => (
                            <tr key={document.id} className="border-t border-[#f2e9e6] hover:bg-[#fcf8f7]">
                              <td className="px-4 py-4">
                                <p className="max-w-[280px] truncate text-sm font-semibold text-[#231f1f]">{document.title}</p>
                              </td>
                              <td className="px-4 py-4">
                                <span className="rounded-full border border-[#f0d9d7] bg-[#fff4f3] px-2.5 py-1 text-[10px] font-semibold text-[#c84242]">
                                  {getCategoryLabel(document.category)}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-[#5d5351]">{document.fileType || "-"}</td>
                              <td className="px-4 py-4 text-sm text-[#5d5351]">{formatDateTime(document.indexedAt)}</td>
                              <td className="px-4 py-4 text-sm font-semibold text-[#231f1f]">{document.chunksCount ?? "-"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid gap-5">
                  <div className="rounded-2xl border border-[#eadfdd] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[#a5918e]">Acces recents</p>
                        <h2 className="mt-1 text-[20px] font-semibold text-[#201d1d]">Dernier acces user</h2>
                      </div>
                      <Clock3 size={17} className="text-[#cf2027]" />
                    </div>

                    <div className="mt-4 space-y-3">
                      {dashboard.latestAccess.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#eadfdd] bg-[#fbf8f7] px-4 py-5 text-sm text-[#7e7370]">
                          Aucun acces recent.
                        </div>
                      ) : (
                        dashboard.latestAccess.map((access) => (
                          <div key={access.userId} className="rounded-xl border border-[#f0e3e1] bg-[#fcf8f7] px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#231f1f]">{access.userName}</p>
                                <p className="mt-1 truncate text-[12px] text-[#7e7370]">{access.email}</p>
                              </div>
                              <span className="rounded-full border border-[#eadfdd] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#6e625f]">
                                {access.authMethod.toUpperCase()}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[12px] text-[#7e7370]">
                              <span>{access.role === "ADMIN" ? "Admin" : "Utilisateur"}</span>
                              <span>{formatRelative(access.lastActivityAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#eadfdd] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[#a5918e]">Urgences</p>
                        <h2 className="mt-1 text-[20px] font-semibold text-[#201d1d]">Cas prioritaires</h2>
                      </div>
                      <Activity size={17} className="text-[#cf2027]" />
                    </div>

                    <div className="mt-4 space-y-3">
                      {dashboard.urgentCases.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#eadfdd] bg-[#fbf8f7] px-4 py-5 text-sm text-[#7e7370]">
                          Aucun cas urgent pour le moment.
                        </div>
                      ) : (
                        dashboard.urgentCases.map((item) => (
                          <div key={item.id} className="rounded-xl border border-[#f4d7d5] bg-[#fff5f4] px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#231f1f]">{item.ticketNumber}</p>
                                <p className="mt-1 truncate text-[12px] text-[#7e7370]">{item.subject}</p>
                              </div>
                              <span className="rounded-full border border-[#f0c4c4] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#cf2027]">
                                {getStatusLabel(item.status)}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[12px] text-[#7e7370]">
                              <span>{item.userEmail}</span>
                              <span>{formatRelative(item.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
