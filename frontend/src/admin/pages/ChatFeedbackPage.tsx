import { useCallback, useEffect, useMemo, useState } from "react";

import Snackbar from "../components/Snackbar";
import AvisFilterBar from "../components/avis/AvisFilterBar";
import DistributionCard from "../components/avis/DistributionCard";
import DocumentsTable from "../components/avis/DocumentsTable";
import Header from "../components/avis/Header";
import QualityCard from "../components/avis/QualityCard";
import StatsGrid from "../components/avis/StatsGrid";
import TrendChart from "../components/avis/TrendChart";
import type { ChatFeedbackDocumentStat, ChatFeedbackStats } from "../../models/chat-feedback";
import { fetchChatFeedbackStats } from "../../services/chat-feedback.service";
import { reindexDocument } from "../../services/documents.service";

type SortOption = "signalements" | "likes" | "dislikes";

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
  const [snackbar, setSnackbar] = useState({ open: false, message: "", tone: "info" as "success" | "error" | "info" });
  const closeSnackbar = useCallback(() => setSnackbar((s) => ({ ...s, open: false })), []);
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [selectedDistributionName, setSelectedDistributionName] = useState("");
  const [docSearch, setDocSearch] = useState("");
  const [docSortBy, setDocSortBy] = useState<SortOption>("signalements");

  useEffect(() => {
    document.title = "Avis chat | CIMF";
    void loadStats();
  }, []);

  async function loadStats() {
    try {
      setIsLoading(true);
      const data = await fetchChatFeedbackStats();
      setStats(data);
      setSelectedDistributionName((current) => {
        if (current && data.distribution.some((item) => item.documentName === current)) {
          return current;
        }
        return data.distribution[0]?.documentName ?? "";
      });
    } catch (loadError) {
      setSnackbar({ open: true, tone: "error", message: loadError instanceof Error ? loadError.message : "Impossible de charger les avis chat." });
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
      const result = await reindexDocument({ apiBaseUrl, documentId: document.documentId });
      setSnackbar({ open: true, tone: "success", message: result.message || `${document.documentName} est en réindexation.` });
      await loadStats();
    } catch (actionError) {
      setSnackbar({ open: true, tone: "error", message: actionError instanceof Error ? actionError.message : "Impossible de réindexer ce document." });
    } finally {
      setBusyDocumentId(null);
    }
  }

  const distributionTotal =
    stats.summary.documentSignalements ?? stats.distribution.reduce((sum, item) => sum + item.count, 0);

  const filteredDocuments = useMemo(() => {
    let items = stats.documents;
    if (docSearch.trim()) {
      const q = docSearch.trim().toLowerCase();
      items = items.filter((d) => d.documentName.toLowerCase().includes(q));
    }
    return [...items].sort((a, b) => b[docSortBy] - a[docSortBy]);
  }, [stats.documents, docSearch, docSortBy]);

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Header
        reportedResponsesCount={stats.summary.reportedResponses}
        documentSignalementsCount={distributionTotal}
        onRefresh={() => void loadStats()}
        isLoading={isLoading}
      />

      <main className="space-y-4 px-2 py-1">
        <StatsGrid summary={stats.summary} isLoading={isLoading} />

        <div className="grid gap-4 lg:grid-cols-[1fr_310px] xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-4">
            <TrendChart trend={stats.trend} isLoading={isLoading} />
            <AvisFilterBar
              search={docSearch}
              sortBy={docSortBy}
              onSearchChange={setDocSearch}
              onSortChange={setDocSortBy}
              resultCount={filteredDocuments.length}
            />
            <DocumentsTable documents={filteredDocuments} busyDocumentId={busyDocumentId} onReindex={handleReindex} />
          </div>

          <div className="min-w-0 space-y-4">
            <QualityCard quality={stats.quality} />
            <DistributionCard
              distribution={stats.distribution}
              total={distributionTotal}
              selectedName={selectedDistributionName}
              onSelectedNameChange={setSelectedDistributionName}
            />
          </div>
        </div>
      </main>
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        tone={snackbar.tone}
        onClose={closeSnackbar}
      />
    </div>
  );
}
