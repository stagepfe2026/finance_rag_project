import { useCallback, useEffect, useMemo, useState } from "react";

import Snackbar from "../components/Snackbar";
import ReclamationDetailPanel from "../components/réclamation/ReclamationDetailPanel";
import ReclamationFilters from "../components/réclamation/ReclamationFilters";
import ReclamationLayout from "../components/réclamation/ReclamationLayout";
import ReclamationList from "../components/réclamation/ReclamationList";
import type { Reclamation } from "../../models/reclamation";
import {
  fetchAdminReclamations,
  resolveReclamationAsAdmin,
  takeReclamationAsAdmin,
} from "../../services/admin-reclamation.service";

type StatusFilter = "ALL" | Extract<Reclamation["status"], "PENDING" | "IN_PROGRESS" | "RESOLVED">;

export default function ReclamationPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [adminReply, setAdminReply] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTaking, setIsTaking] = useState(false);
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
      setSnackbar({ open: true, tone: "error", message: loadError instanceof Error ? loadError.message : "Impossible de charger les réclamations." });
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
        item.ticketNumber.toLowerCase().includes(normalizedSearch) ||
        item.userEmail.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reclamations, search, statusFilter]);

  const selectedReclamation = useMemo(
    () =>
      filteredReclamations.find((item) => item._id === selectedId) ??
      reclamations.find((item) => item._id === selectedId) ??
      null,
    [filteredReclamations, reclamations, selectedId],
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
      setSnackbar({ open: true, tone: "error", message: submitError instanceof Error ? submitError.message : "Impossible d'envoyer la réponse." });
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
      setSnackbar({ open: true, tone: "error", message: takeError instanceof Error ? takeError.message : "Impossible de prendre en charge la reclamation." });
    } finally {
      setIsTaking(false);
    }
  }

  function handleSelectReclamation(reclamation: Reclamation) {
    setSelectedId(reclamation._id);
    setShowPanel(true);
  }

  return (
    <ReclamationLayout stats={stats}>
      <div className="flex min-h-[620px] gap-4">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#e5eaf2] bg-white">
          <ReclamationFilters
            search={search}
            statusFilter={statusFilter}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
          />

          <ReclamationList
            items={filteredReclamations}
            selectedId={selectedId}
            showPanel={showPanel}
            isLoading={isLoading}
            onSelect={handleSelectReclamation}
          />
        </div>

        {showPanel && selectedReclamation ? (
          <ReclamationDetailPanel
            apiBaseUrl={apiBaseUrl}
            reclamation={selectedReclamation}
            liveStatus={liveStatus}
            isExpanded={isPanelExpanded}
            adminReply={adminReply}
            alreadyHandled={alreadyHandled}
            isSubmitting={isSubmitting}
            isTaking={isTaking}
            onToggleExpanded={() => setIsPanelExpanded((current) => !current)}
            onClose={() => setShowPanel(false)}
            onReplyChange={setAdminReply}
            onSubmitReply={() => void handleSubmitReply()}
            onTakeReclamation={() => void handleTakeReclamation()}
          />
        ) : null}
      </div>
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        tone={snackbar.tone}
        onClose={closeSnackbar}
      />
    </ReclamationLayout>
  );
}
