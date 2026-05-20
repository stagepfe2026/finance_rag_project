import { useCallback, useEffect, useMemo, useState } from "react";

import type { Reclamation, ReclamationPriority, ReclamationProblemType } from "../../models/reclamation";
import {
  fetchAdminReclamations,
  resolveReclamationAsAdmin,
  takeReclamationAsAdmin,
} from "../../services/admin-reclamation.service";

export type StatusFilter = "ALL" | Extract<Reclamation["status"], "PENDING" | "IN_PROGRESS" | "RESOLVED">;
export type CategoryFilter = "ALL" | ReclamationProblemType;
export type PriorityFilter = "ALL" | ReclamationPriority;

const PAGE_SIZE = 8;

export function useReclamationViewModel() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [adminReply, setAdminReply] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTaking, setIsTaking] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", tone: "info" as "success" | "error" | "info" });
  const closeSnackbar = useCallback(() => setSnackbar((s) => ({ ...s, open: false })), []);

  useEffect(() => {
    void loadReclamations();
  }, []);

  async function loadReclamations() {
    try {
      setIsLoading(true);
      const items = await fetchAdminReclamations();
      setReclamations(items);
    } catch (loadError) {
      setSnackbar({
        open: true,
        tone: "error",
        message: loadError instanceof Error ? loadError.message : "Impossible de charger les réclamations.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const urgentItems = useMemo(
    () => reclamations.filter((item) => item.priority === "URGENT" && item.status !== "RESOLVED"),
    [reclamations],
  );

  const stats = useMemo(
    () => ({
      total: reclamations.length,
      pending: reclamations.filter((item) => item.status === "PENDING").length,
      inProgress: reclamations.filter((item) => item.status === "IN_PROGRESS").length,
      resolved: reclamations.filter((item) => item.status === "RESOLVED").length,
      urgent: urgentItems.length,
    }),
    [reclamations, urgentItems],
  );

  const filteredReclamations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return reclamations.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.subject.toLowerCase().includes(normalizedSearch) ||
        item.referenceNumber.toLowerCase().includes(normalizedSearch) ||
        item.userEmail.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesCategory = categoryFilter === "ALL" || item.issueCategory === categoryFilter;
      const matchesPriority = priorityFilter === "ALL" || item.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [categoryFilter, priorityFilter, reclamations, search, statusFilter]);

  const selectedReclamation = useMemo(
    () =>
      filteredReclamations.find((item) => item._id === selectedId) ??
      reclamations.find((item) => item._id === selectedId) ??
      null,
    [filteredReclamations, reclamations, selectedId],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReclamations.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedReclamations = useMemo(
    () => filteredReclamations.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE),
    [filteredReclamations, safeCurrentPage],
  );

  const alreadyHandled = Boolean(selectedReclamation?.adminReplyAt || selectedReclamation?.adminReply);
  const liveStatus: Reclamation["status"] = alreadyHandled
    ? "RESOLVED"
    : adminReply.trim().length > 0
      ? "IN_PROGRESS"
      : selectedReclamation?.status ?? "PENDING";

  useEffect(() => {
    if (selectedReclamation) {
      setAdminReply(selectedReclamation.adminReply ?? "");
    }
  }, [selectedReclamation]);

  async function handleSubmitReply() {
    if (!selectedReclamation || alreadyHandled) {
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await resolveReclamationAsAdmin(selectedReclamation._id, adminReply, "RESOLVED");
      setReclamations((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setSnackbar({ open: true, tone: "success", message: "La réclamation a été traitée avec succès." });
    } catch (submitError) {
      setSnackbar({
        open: true,
        tone: "error",
        message: submitError instanceof Error ? submitError.message : "Impossible d'envoyer la réponse.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTakeReclamation() {
    if (!selectedReclamation) return;
    try {
      setIsTaking(true);
      const updated = await takeReclamationAsAdmin(selectedReclamation._id);
      setReclamations((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setSnackbar({ open: true, tone: "success", message: "Reclamation prise en charge avec succes." });
    } catch (takeError) {
      setSnackbar({
        open: true,
        tone: "error",
        message: takeError instanceof Error ? takeError.message : "Impossible de prendre en charge la reclamation.",
      });
    } finally {
      setIsTaking(false);
    }
  }

  function handleSelectReclamation(reclamation: Reclamation) {
    setSelectedId(reclamation._id);
    setShowPanel(true);
  }

  return {
    apiBaseUrl,
    reclamations,
    selectedId,
    setSelectedId,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    priorityFilter,
    setPriorityFilter,
    isPanelExpanded,
    setIsPanelExpanded,
    showPanel,
    setShowPanel,
    adminReply,
    setAdminReply,
    isLoading,
    isSubmitting,
    isTaking,
    currentPage,
    setCurrentPage,
    snackbar,
    closeSnackbar,
    urgentItems,
    stats,
    filteredReclamations,
    selectedReclamation,
    totalPages,
    safeCurrentPage,
    paginatedReclamations,
    alreadyHandled,
    liveStatus,
    loadReclamations,
    handleSubmitReply,
    handleTakeReclamation,
    handleSelectReclamation,
  };
}
