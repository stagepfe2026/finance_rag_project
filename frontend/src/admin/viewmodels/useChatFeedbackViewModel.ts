import { useCallback, useEffect, useMemo, useState } from "react";

import type { ChatFeedbackDocumentStat, ChatFeedbackStats } from "../../models/chat-feedback";
import { fetchChatFeedbackStats } from "../../services/chat-feedback.service";
import { reindexDocument } from "../../services/documents.service";

export type SortOption = "signalements" | "likes" | "dislikes";

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

export function useChatFeedbackViewModel() {
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
      setSnackbar({
        open: true,
        tone: "error",
        message: loadError instanceof Error ? loadError.message : "Impossible de charger les avis chat.",
      });
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
      setSnackbar({
        open: true,
        tone: "success",
        message: result.message || `${document.documentName} est en réindexation.`,
      });
      await loadStats();
    } catch (actionError) {
      setSnackbar({
        open: true,
        tone: "error",
        message: actionError instanceof Error ? actionError.message : "Impossible de réindexer ce document.",
      });
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

  return {
    stats,
    isLoading,
    snackbar,
    closeSnackbar,
    busyDocumentId,
    selectedDistributionName,
    setSelectedDistributionName,
    docSearch,
    setDocSearch,
    docSortBy,
    setDocSortBy,
    filteredDocuments,
    distributionTotal,
    loadStats,
    handleReindex,
  };
}
