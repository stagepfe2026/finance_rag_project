import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, Calendar, FileWarning, MessageSquareWarning, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { Link } from "react-router-dom";

import AdminPageShell from "../components/layout/AdminPageShell";
import type { ChatFeedbackDocumentStat, ChatFeedbackStats, ChatFeedbackTrendPoint } from "../../models/chat-feedback";
import { fetchChatFeedbackStats } from "../../services/chat-feedback.service";
import { reindexDocument } from "../../services/documents.service";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const emptyStats: ChatFeedbackStats = {
  summary: {
    reportedResponses: 0,
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

const distributionColors = ["#ef3b45", "#f08c95", "#ffb23a", "#d8d0d0", "#7cc66d"];

function buildLinePoints(trend: ChatFeedbackTrendPoint[], key: "likes" | "dislikes" | "signalements", maxValue: number) {
  if (trend.length === 0) {
    return "";
  }

  return trend
    .map((point, index) => {
      const x = trend.length === 1 ? 50 : (index / (trend.length - 1)) * 100;
      const y = 68 - (point[key] / maxValue) * 56;
      return `${x},${y}`;
    })
    .join(" ");
}

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
  tone?: "navy" | "red" | "orange" | "blue" | "green";
}) {
  const toneClasses = {
    navy: "bg-[#eef4ff] text-[#273043]",
    red: "bg-[#fff0f1] text-[#9d0208]",
    orange: "bg-[#fff3e8] text-[#f97316]",
    blue: "bg-[#eef4ff] text-[#2458cf]",
    green: "bg-[#effbea] text-[#52b94e]",
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
          <p className="mt-1 truncate text-[11px] font-semibold text-[#3560c9]">{helper}</p>
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
      <td className="px-4 py-3 text-center text-[12px] font-semibold text-[#52b94e]">{document.likes}</td>
      <td className="px-4 py-3 text-center text-[12px] font-semibold text-[#f97316]">{document.dislikes}</td>
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

  const maxTrendValue = useMemo(
    () => Math.max(1, ...stats.trend.flatMap((point) => [point.likes, point.dislikes, point.signalements])),
    [stats.trend],
  );
  const likesPoints = buildLinePoints(stats.trend, "likes", maxTrendValue);
  const dislikesPoints = buildLinePoints(stats.trend, "dislikes", maxTrendValue);
  const signalementsPoints = buildLinePoints(stats.trend, "signalements", maxTrendValue);
  const totalQuality = Math.max(1, stats.quality.likes + stats.quality.dislikes);
  const likePct = Math.round((stats.quality.likes / totalQuality) * 100);
  const dislikePct = Math.round((stats.quality.dislikes / totalQuality) * 100);

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
                tone="green"
              />
              <StatCard
                icon={<ThumbsDown size={21} />}
                label="Dislikes"
                value={stats.summary.dislikes}
                helper="A ameliorer"
                tone="orange"
              />
              <StatCard
                icon={<FileWarning size={21} />}
                label="Document le plus signale"
                value={stats.summary.mostFlaggedDocument?.documentName || "Aucun"}
                helper={`${stats.summary.mostFlaggedDocument?.signalements ?? 0} signalements`}
                tone="red"
              />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_380px]">
              <section className="rounded-lg border border-[#e8edf7] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-[#273043]">Evolution des interactions</h2>
                  <div className="flex items-center gap-4 text-[11px] font-medium text-[#5f6680]">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#52b94e]" />Likes</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ff7a00]" />Dislikes</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#9d0208]" />Signalements</span>
                  </div>
                </div>
                <div className="mt-5 h-[210px]">
                  <svg viewBox="0 0 100 80" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                    {[12, 26, 40, 54, 68].map((y) => (
                      <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#e8edf7" strokeDasharray="2 2" />
                    ))}
                    <polyline fill="none" stroke="#52b94e" strokeWidth="1.7" points={likesPoints} />
                    <polyline fill="none" stroke="#ff7a00" strokeWidth="1.7" points={dislikesPoints} />
                    <polyline fill="none" stroke="#9d0208" strokeWidth="1.7" points={signalementsPoints} />
                    {stats.trend.map((point, index) => {
                      const x = stats.trend.length === 1 ? 50 : (index / (stats.trend.length - 1)) * 100;
                      return (
                        <text key={point.date} x={x} y="79" textAnchor="middle" className="fill-[#7b849f] text-[3px]">
                          {point.label}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              </section>

              <section className="rounded-lg border border-[#e8edf7] bg-white p-4 shadow-sm">
                <h2 className="text-sm font-bold text-[#273043]">Qualite des reponses</h2>
                <div className="mt-4 flex items-center gap-5">
                  <div
                    className="grid h-36 w-36 shrink-0 place-items-center rounded-full"
                    style={{
                      background: `conic-gradient(#7cc66d 0 ${likePct}%, #ff9f1a ${likePct}% ${likePct + dislikePct}%, #eef1f7 ${likePct + dislikePct}% 100%)`,
                    }}
                  >
                    <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
                      <div>
                        <p className="text-3xl font-bold text-[#273043]">{stats.quality.satisfactionRate}%</p>
                        <p className="text-[10px] font-semibold text-[#5f6680]">Satisfaction</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid flex-1 gap-3 text-[12px]">
                    <p className="flex items-center justify-between text-[#273043]">
                      <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#7cc66d]" />Likes</span>
                      <strong>{stats.quality.likes}</strong>
                    </p>
                    <p className="flex items-center justify-between text-[#273043]">
                      <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#ff7a00]" />Dislikes</span>
                      <strong>{stats.quality.dislikes}</strong>
                    </p>
                    <p className="flex items-center justify-between text-[#273043]">
                      <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#9d0208]" />Signalements</span>
                      <strong>{stats.quality.signalements}</strong>
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-[#eef4ff] px-3 py-3 text-center text-[12px] font-semibold text-[#273043]">
                  Taux de satisfaction = Likes / (Likes + Dislikes) x 100
                </div>
              </section>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_380px]">
              <section className="overflow-hidden rounded-lg border border-[#e8edf7] bg-white shadow-sm">
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
                  <Link to="/admin/documents/list" className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#2458cf]">
                    Voir tous les documents <ArrowRight size={14} />
                  </Link>
                </div>
              </section>

              <section className="rounded-lg border border-[#e8edf7] bg-white p-4 shadow-sm">
                <h2 className="text-sm font-bold text-[#273043]">Repartition des signalements</h2>
                <div className="mt-5 flex items-center gap-5">
                  <div
                    className="grid h-36 w-36 shrink-0 place-items-center rounded-full"
                    style={{ background: buildDistributionGradient(stats.distribution) }}
                  >
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-[#7b849f]">Total</p>
                        <p className="text-2xl font-bold text-[#273043]">{stats.summary.reportedResponses}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid flex-1 gap-3">
                    {stats.distribution.length === 0 ? (
                      <p className="text-[12px] text-[#7b849f]">Aucun document signale.</p>
                    ) : (
                      stats.distribution.map((item, index) => (
                        <p key={`${item.documentName}-${index}`} className="flex items-center justify-between gap-3 text-[12px] text-[#273043]">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: distributionColors[index % distributionColors.length] }}
                            />
                            <span className="truncate">{item.documentName}</span>
                          </span>
                          <strong className="shrink-0">{item.count} ({item.percentage}%)</strong>
                        </p>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-[#eef1f7] pt-4">
                  <h3 className="text-[12px] font-bold text-[#273043]">Dernieres mauvaises reponses</h3>
                  <div className="mt-3 grid gap-3">
                    {stats.recentDislikes.slice(0, 3).map((item) => (
                      <article key={item.messageId} className="rounded-lg bg-[#f7f9fc] px-3 py-2">
                        <p className="line-clamp-2 text-[11px] leading-5 text-[#4c587a]">{item.content}</p>
                        <p className="mt-1 text-[10px] font-semibold text-[#9d0208]">
                          {item.sources.map((source) => source.documentName).join(", ") || "Source non referencee"}
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
