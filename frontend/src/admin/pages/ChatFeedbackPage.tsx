import { useEffect, useState } from "react";

import DistributionCard from "../components/avis/DistributionCard";
import DocumentsTable from "../components/avis/DocumentsTable";
import Header from "../components/avis/Header";
import QualityCard from "../components/avis/QualityCard";
import RecentDislikes from "../components/avis/RecentDislikes";
import StatsGrid from "../components/avis/StatsGrid";
import TrendChart from "../components/avis/TrendChart";
import type { ChatFeedbackDocumentStat, ChatFeedbackStats } from "../../models/chat-feedback";
import { fetchChatFeedbackStats } from "../../services/chat-feedback.service";
import { reindexDocument } from "../../services/documents.service";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const EMPTY_STATS: ChatFeedbackStats = {
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

export default function ChatFeedbackPage() {
  const [stats, setStats] = useState<ChatFeedbackStats>(EMPTY_STATS);
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
      setActionMessage(result.message || `${document.documentName} est en réindexation.`);
      await loadStats();
    } catch (actionError) {
      setActionMessage(actionError instanceof Error ? actionError.message : "Impossible de réindexer ce document.");
    } finally {
      setBusyDocumentId(null);
    }
  }

  const distributionTotal =
    stats.summary.documentSignalements ?? stats.distribution.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Header
        reportedResponsesCount={stats.summary.reportedResponses}
        documentSignalementsCount={distributionTotal}
        onRefresh={() => void loadStats()}
        isLoading={isLoading}
      />

      <main className="space-y-4 px-2 py-1">
        {error ? (
          <div className="rounded border border-[#f3c6cc] bg-[#f5e6e7] px-2 py-2.5 text-sm text-[#9d0208]">
            {error}
          </div>
        ) : null}

        {actionMessage ? (
          <div className="rounded border border-[#e5eaf2] bg-white px-2 py-2.5 text-sm font-medium text-[#071f3d]">
            {actionMessage}
          </div>
        ) : null}

        <StatsGrid summary={stats.summary} isLoading={isLoading} />

        <div className="grid gap-4 lg:grid-cols-[1fr_310px] xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-4">
            <TrendChart trend={stats.trend} isLoading={isLoading} />
            <DocumentsTable documents={stats.documents} busyDocumentId={busyDocumentId} onReindex={handleReindex} />
          </div>

          <div className="min-w-0 space-y-4">
            <QualityCard quality={stats.quality} />
            <DistributionCard
              distribution={stats.distribution}
              total={distributionTotal}
              selectedName={selectedDistributionName}
              onSelectedNameChange={setSelectedDistributionName}
            />
            <RecentDislikes items={stats.recentDislikes} />
          </div>
        </div>
      </main>
    </div>
  );
}
