import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { ArrowRight, Calendar, FileWarning, MessageSquareWarning, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { Link } from "react-router-dom";

import AdminPageShell from "../components/layout/AdminPageShell";
import type { ChatFeedbackDocumentStat, ChatFeedbackStats } from "../../models/chat-feedback";
import { fetchChatFeedbackStats } from "../../services/chat-feedback.service";
import { reindexDocument } from "../../services/documents.service";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const emptyStats: ChatFeedbackStats = {
  summary: {
    reportedResponses: 0,
    dislikesWithoutSource: 0,
    documentSignalements: 0,
    likes: 0,
    dislikes: 0,
    satisfactionRate: 0,
    mostFlaggedDocument: null,
  },
  trend: [],
  quality: {
    likes: 0,
    dislikes: 0,
    signalements: 0,
    satisfactionRate: 0,
  },
  documents: [],
  distribution: [],
  recentDislikes: [],
};

const navyBlue = "#071f3d";
const red = "#9d0208";
const rose = "#f06f80";
const mutedRose = "#d995a0";
const distributionColors = [navyBlue, red, rose, "#8d7f83", mutedRose];

function buildDistributionGradient(items: ChatFeedbackStats["distribution"]) {
  if (items.length === 0) {
    return "#eef1f7";
  }

  let start = 0;
  const segments = items.map((item, index) => {
    const end = start + item.percentage;
    const segment = `${distributionColors[index % distributionColors.length]} ${start}% ${end}%`;
    start = end;
    return segment;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatCard({
  icon,
  label,
  value,
  helper,
  tone = "navy",
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper: string;
  tone?: "navy" | "red" | "rose" | "blue";
}) {
  const toneClasses = {
    navy: "bg-[#eef4ff] text-[#071f3d]",
    red: "bg-[#fff0f1] text-[#9d0208]",
    rose: "bg-[#fff0f2] text-[#9d0208]",
    blue: "bg-[#eef4ff] text-[#071f3d]",
  };
  const valueClassName =
    typeof value === "string" && value.length > 16
      ? "mt-1 truncate text-[15px] font-bold text-[#273043]"
      : "mt-1 text-2xl font-bold text-[#273043]";

  return (
    <article className="rounded-lg border border-[#e8edf7] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneClasses[tone]}`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#5f6680]">{label}</p>
          <p className={valueClassName}>{value}</p>
          <p className="mt-1 truncate text-[11px] font-semibold text-[#071f3d]">{helper}</p>
        </div>
      </div>
    </article>
  );
}

function DocumentRow({
  document,
  onReindex,
  isBusy,
}: {
  document: ChatFeedbackDocumentStat;
  onReindex: (document: ChatFeedbackDocumentStat) => void;
  isBusy: boolean;
}) {
  return (
    <tr className="border-t border-[#eef1f7]">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#fff0f1] text-[#9d0208]">
            <FileWarning size={14} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-[#273043]">{document.documentName}</p>
            <p className="text-[10px] text-[#7b849f]">{document.documentType || document.category || "Source chat"}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="rounded-md bg-[#fff0f1] px-2 py-1 text-[11px] font-semibold text-[#9d0208]">
          {document.signalements}
        </span>
      </td>
      <td className="px-4 py-3 text-center text-[12px] font-semibold text-[#071f3d]">{document.likes}</td>
      <td className="px-4 py-3 text-center text-[12px] font-semibold text-[#9d0208]">{document.dislikes}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="w-9 text-right text-[11px] font-semibold text-[#273043]">{document.reportRate}%</span>
          <span className="h-1.5 flex-1 rounded-full bg-[#e5e9f2]">
            <span
              className="block h-full rounded-full bg-[#9d0208]"
              style={{ width: `${Math.min(100, document.reportRate)}%` }}
            />
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          disabled={!document.documentId || isBusy}
          onClick={() => onReindex(document)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#d8def0] px-3 py-1.5 text-[11px] font-semibold text-[#273043] transition hover:border-[#273043] hover:bg-[#f4f7ff] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RefreshCw size={13} className={isBusy ? "animate-spin" : ""} />
          Reindexer
        </button>
      </td>
    </tr>
  );
}

export default function ChatFeedbackPage() {
  const [stats, setStats] = useState<ChatFeedbackStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [selectedDistributionName, setSelectedDistributionName] = useState("");

  useEffect(() => {
    document.title = "Avis chat | CIMF";
    void loadStats();
  }, []);

  async function loadStats() {
    try {
      setIsLoading(true);
      setError("");
      const data = await fetchChatFeedbackStats();
      setStats(data);
      setSelectedDistributionName((current) => {
        if (current && data.distribution.some((item) => item.documentName === current)) {
          return current;
        }
        return data.distribution[0]?.documentName ?? "";
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les avis chat.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReindex(document: ChatFeedbackDocumentStat) {
    if (!document.documentId) {
      return;
    }

    try {
      setBusyDocumentId(document.documentId);
      setActionMessage("");
      const result = await reindexDocument({ apiBaseUrl, documentId: document.documentId });
      setActionMessage(result.message || `${document.documentName} est en reindexation.`);
      await loadStats();
    } catch (actionError) {
      setActionMessage(actionError instanceof Error ? actionError.message : "Impossible de reindexer ce document.");
    } finally {
      setBusyDocumentId(null);
    }
  }

  const trendSeries = useMemo(
    () => [
      { name: "Likes", data: stats.trend.map((point) => point.likes) },
      { name: "Dislikes", data: stats.trend.map((point) => point.dislikes) },
      { name: "Signalements document", data: stats.trend.map((point) => point.signalements) },
    ],
    [stats.trend],
  );
  const trendCategories = useMemo(() => stats.trend.map((point) => point.label), [stats.trend]);
  const trendChartOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        id: "admin-chat-feedback-trend",
        type: "area",
        height: 260,
        parentHeightOffset: 0,
        toolbar: { show: false },
        zoom: { enabled: false },
        redrawOnParentResize: true,
        redrawOnWindowResize: true,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      },
      colors: [navyBlue, rose, red],
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2.8, lineCap: "round" },
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          opacityFrom: 0.5,
          opacityTo: 0.06,
          stops: [0, 70, 100],
        },
      },
      markers: {
        size: 4,
        colors: ["#ffffff"],
        strokeColors: [navyBlue, rose, red],
        strokeWidth: 2,
        hover: { size: 6 },
      },
      grid: {
        borderColor: "#e5ecf5",
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 2, right: 14, bottom: 0, left: 8 },
      },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "right",
        fontSize: "12px",
        fontWeight: 700,
        labels: { colors: navyBlue },
        markers: { size: 8, shape: "circle", strokeWidth: 0 },
      },
      xaxis: {
        categories: trendCategories,
        axisBorder: { show: true, color: "#9aa6b8" },
        axisTicks: { show: false },
        tooltip: { enabled: false },
        labels: {
          rotate: 0,
          hideOverlappingLabels: true,
          style: { colors: "#6c7894", fontSize: "11px", fontWeight: 700 },
        },
      },
      yaxis: {
        min: 0,
        forceNiceScale: true,
        tickAmount: 4,
        labels: {
          style: { colors: "#8a96ad", fontSize: "11px", fontWeight: 700 },
        },
      },
      tooltip: { shared: true, intersect: false, marker: { show: true } },
      responsive: [
        {
          breakpoint: 640,
          options: {
            chart: { height: 230 },
            legend: { horizontalAlign: "left" },
            markers: { size: 3 },
          },
        },
      ],
    }),
    [trendCategories],
  );
  const totalQuality = Math.max(1, stats.quality.likes + stats.quality.dislikes);
  const likePct = Math.round((stats.quality.likes / totalQuality) * 100);
  const dislikePct = Math.round((stats.quality.dislikes / totalQuality) * 100);
  const selectedDistributionItem = useMemo(
    () => stats.distribution.find((item) => item.documentName === selectedDistributionName) ?? stats.distribution[0] ?? null,
    [selectedDistributionName, stats.distribution],
  );
  const selectedDistributionDocument = useMemo(
    () => stats.documents.find((item) => item.documentName === selectedDistributionItem?.documentName) ?? null,
    [selectedDistributionItem, stats.documents],
  );
  const distributionTotal = stats.summary.documentSignalements ?? stats.distribution.reduce((sum, item) => sum + item.count, 0);

  return (
    <AdminPageShell>
          <header className="bg-[#f7f9fc] px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-[26px] font-bold tracking-tight text-[#273043]">
                  Statistiques des <span className="text-[#9d0208]">reponses</span>
                </h1>
                <p className="mt-1 text-[12px] text-[#5f6680]">
                  Likes, dislikes et documents sources associes aux reponses du chat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadStats()}
                className="inline-flex items-center gap-2 rounded-lg border border-[#d8def0] bg-white px-3 py-2 text-[12px] font-semibold text-[#273043] transition hover:bg-[#f4f7ff]"
              >
                <Calendar size={14} />
                7 derniers jours
              </button>
            </div>
          </header>

          <section className="px-5 pb-5 md:px-6">
            {error ? (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}
            {actionMessage ? (
              <div className="mb-4 rounded-lg border border-[#d8def0] bg-white px-4 py-3 text-sm font-medium text-[#273043]">
                {actionMessage}
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-4">
              <StatCard
                icon={<MessageSquareWarning size={21} />}
                label="Reponses signalees"
                value={stats.summary.reportedResponses}
                helper={isLoading ? "Chargement..." : "A verifier"}
                tone="blue"
              />
              <StatCard
                icon={<ThumbsUp size={21} />}
                label="Likes"
                value={stats.summary.likes}
                helper="Reponses utiles"
                tone="navy"
              />
              <StatCard
                icon={<ThumbsDown size={21} />}
                label="Dislikes"
                value={stats.summary.dislikes}
                helper={`${stats.summary.dislikesWithoutSource ?? 0} sans source`}
                tone="rose"
              />
              <StatCard
                icon={<FileWarning size={21} />}
                label="Document le plus signale"
                value={stats.summary.mostFlaggedDocument?.documentName || "Aucun"}
                helper={`${stats.summary.mostFlaggedDocument?.signalements ?? 0} signalements`}
                tone="red"
              />
            </div>

            <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] 2xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="min-w-0 rounded-lg border border-[#e8edf7] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-[#071f3d]">Evolution des interactions</h2>
                  <span className="rounded-lg border border-[#d8def0] bg-[#eef4ff] px-3 py-1.5 text-[11px] font-bold text-[#071f3d]">
                    Area chart
                  </span>
                </div>
                <div className="mt-4 min-w-0 rounded-lg border border-[#e8edf7] bg-[#fcfdff] px-2 pb-2 pt-3">
                  {isLoading ? (
                    <div className="flex h-[260px] items-center justify-center text-sm text-[#5f6680]">Chargement...</div>
                  ) : stats.trend.length === 0 ? (
                    <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-[#d8def0] bg-[#f7f9fc] text-sm text-[#5f6680]">
                      Aucune donnee disponible.
                    </div>
                  ) : (
                    <Chart options={trendChartOptions} series={trendSeries} type="area" height={260} width="100%" />
                  )}
                </div>
              </section>

              <section className="min-w-0 overflow-hidden rounded-lg border border-[#e8edf7] bg-white p-4 shadow-sm">
                <h2 className="text-sm font-bold text-[#273043]">Qualite des reponses</h2>
                <div className="mt-4 grid items-center gap-4 sm:grid-cols-[132px_minmax(0,1fr)]">
                  <div
                    className="grid h-32 w-32 shrink-0 place-items-center rounded-full"
                    style={{
                      background: `conic-gradient(${navyBlue} 0 ${likePct}%, ${red} ${likePct}% ${likePct + dislikePct}%, #eef1f7 ${likePct + dislikePct}% 100%)`,
                    }}
                  >
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center shadow-inner">
                      <div>
                        <p className="text-2xl font-bold text-[#071f3d]">{stats.quality.satisfactionRate}%</p>
                        <p className="text-[10px] font-semibold text-[#5f6680]">Satisfaction</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid min-w-0 gap-2 text-[12px]">
                    <p className="flex items-center justify-between rounded-lg border border-[#e8edf7] bg-white px-3 py-2 text-[#071f3d]">
                      <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#071f3d]" />Likes</span>
                      <strong>{stats.quality.likes}</strong>
                    </p>
                    <p className="flex items-center justify-between rounded-lg border border-[#e8edf7] bg-white px-3 py-2 text-[#071f3d]">
                      <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#9d0208]" />Dislikes</span>
                      <strong>{stats.quality.dislikes}</strong>
                    </p>
                    <p className="flex items-center justify-between rounded-lg border border-[#e8edf7] bg-white px-3 py-2 text-[#071f3d]">
                      <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#f06f80]" />Signalements doc.</span>
                      <strong>{stats.quality.signalements}</strong>
                    </p>
                    <p className="flex items-center justify-between rounded-lg border border-[#e8edf7] bg-[#f7f9fc] px-3 py-2 text-[#071f3d]">
                      <span>Dislikes sans source</span>
                      <strong>{stats.quality.dislikesWithoutSource ?? 0}</strong>
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-[#eef4ff] px-3 py-3 text-center text-[12px] font-semibold text-[#071f3d]">
                  Taux de satisfaction = Likes / (Likes + Dislikes) x 100
                </div>
              </section>
            </div>

            <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] 2xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="min-w-0 overflow-hidden rounded-lg border border-[#e8edf7] bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 px-4 py-4">
                  <h2 className="text-sm font-bold text-[#273043]">Documents les plus signales</h2>
                  <span className="rounded-lg border border-[#e8edf7] px-2 py-1 text-[11px] font-semibold text-[#5f6680]">
                    {stats.documents.length} elements
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-[#f7f9fc] text-[10px] uppercase tracking-[0.06em] text-[#5f6680]">
                      <tr>
                        <th className="px-4 py-3">Document</th>
                        <th className="px-4 py-3 text-center">Signalements</th>
                        <th className="px-4 py-3 text-center">Likes</th>
                        <th className="px-4 py-3 text-center">Dislikes</th>
                        <th className="px-4 py-3">Taux de signalement</th>
                        <th className="px-4 py-3 text-right">Mesure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.documents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#7b849f]">
                            Aucun avis chat pour le moment.
                          </td>
                        </tr>
                      ) : (
                        stats.documents.map((document) => (
                          <DocumentRow
                            key={document.documentId || document.documentName}
                            document={document}
                            onReindex={handleReindex}
                            isBusy={busyDocumentId === document.documentId}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-[#eef1f7] px-4 py-3 text-center">
                  <Link to="/admin/documents/list" className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#071f3d]">
                    Voir tous les documents <ArrowRight size={14} />
                  </Link>
                </div>
              </section>

              <section className="min-w-0 overflow-hidden rounded-lg border border-[#e8edf7] bg-white p-4 shadow-sm">
                <h2 className="text-sm font-bold text-[#273043]">Repartition des signalements</h2>
                <p className="mt-1 text-[11px] leading-5 text-[#5f6680]">
                  Un signalement document = dislike sur une reponse qui contient au moins une source. Un dislike sans source reste un dislike simple.
                </p>
                <div className="mt-5 grid items-center gap-4 sm:grid-cols-[132px_minmax(0,1fr)]">
                  <div
                    className="grid h-32 w-32 shrink-0 place-items-center rounded-full shadow-[0_18px_34px_rgba(7,31,61,0.08)]"
                    style={{ background: buildDistributionGradient(stats.distribution) }}
                  >
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center shadow-inner">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-[#7b849f]">Total</p>
                        <p className="text-2xl font-bold text-[#071f3d]">{distributionTotal}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid min-w-0 gap-2">
                    {stats.distribution.length === 0 ? (
                      <p className="text-[12px] text-[#7b849f]">Aucun document signale.</p>
                    ) : (
                      stats.distribution.map((item, index) => (
                        <button
                          key={`${item.documentName}-${index}`}
                          type="button"
                          onClick={() => setSelectedDistributionName(item.documentName)}
                          className={[
                            "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-[12px] transition",
                            selectedDistributionItem?.documentName === item.documentName
                              ? "border-[#071f3d] bg-[#eef4ff] text-[#071f3d]"
                              : "border-[#e8edf7] bg-white text-[#273043] hover:border-[#9d0208]",
                          ].join(" ")}
                        >
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: distributionColors[index % distributionColors.length] }}
                            />
                            <span className="truncate">{item.documentName}</span>
                          </span>
                          <strong className="shrink-0">{item.count} ({item.percentage}%)</strong>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {selectedDistributionItem ? (
                  <div className="mt-4 rounded-lg border border-[#e8edf7] bg-[#f7f9fc] p-3">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#6c7894]">Document selectionne</p>
                    <p className="mt-1 truncate text-sm font-bold text-[#071f3d]">{selectedDistributionItem.documentName}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                      <span className="rounded-lg bg-white px-2 py-2 text-[#071f3d]">
                        <strong className="block text-base">{selectedDistributionDocument?.likes ?? 0}</strong>
                        Likes
                      </span>
                      <span className="rounded-lg bg-white px-2 py-2 text-[#9d0208]">
                        <strong className="block text-base">{selectedDistributionDocument?.dislikes ?? selectedDistributionItem.count}</strong>
                        Dislikes
                      </span>
                      <span className="rounded-lg bg-white px-2 py-2 text-[#071f3d]">
                        <strong className="block text-base">{selectedDistributionDocument?.reportRate ?? selectedDistributionItem.percentage}%</strong>
                        Taux
                      </span>
                    </div>
                    {selectedDistributionDocument?.documentId ? (
                      <button
                        type="button"
                        disabled={busyDocumentId === selectedDistributionDocument.documentId}
                        onClick={() => handleReindex(selectedDistributionDocument)}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#d8def0] bg-white px-3 py-2 text-[11px] font-bold text-[#071f3d] transition hover:border-[#071f3d] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RefreshCw size={13} className={busyDocumentId === selectedDistributionDocument.documentId ? "animate-spin" : ""} />
                        Reindexer ce document
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-5 border-t border-[#eef1f7] pt-4">
                  <h3 className="text-[12px] font-bold text-[#273043]">Dernieres mauvaises reponses</h3>
                  <div className="mt-3 grid gap-3">
                    {stats.recentDislikes.slice(0, 3).map((item) => (
                      <article key={item.messageId} className="rounded-lg bg-[#f7f9fc] px-3 py-2">
                        <p className="line-clamp-2 text-[11px] leading-5 text-[#4c587a]">{item.content}</p>
                        <p className="mt-1 text-[10px] font-semibold text-[#9d0208]">
                          {item.sources.map((source) => source.documentName).join(", ") || "Dislike sans source"}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold text-[#071f3d]">
                          {item.isSignalement ? "Signalement document" : "Pas un signalement document"}
                        </p>
                        <p className="mt-1 text-[10px] text-[#7b849f]">{formatDate(item.feedbackAt)}</p>
                      </article>
                    ))}
                    {stats.recentDislikes.length === 0 ? (
                      <p className="text-[12px] text-[#7b849f]">Aucun dislike recent.</p>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          </section>
    </AdminPageShell>
  );
}
