import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Reclamation, ReclamationStatus } from "../../models/reclamation";
import { deleteReclamation, fetchReclamations } from "../../services/reclamation.service";
import ReclamationDesk from "../components/reclamation/ReclamationDesk";

const pageSize = 6;

export default function ReclamationPage() {
  const navigate = useNavigate();

  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReclamationStatus | "ALL">("ALL");
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [page, setPage] = useState(1);
  const [pageError, setPageError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Reclamation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadReclamations() {
    try {
      setIsLoading(true);
      setPageError("");
      const data = await fetchReclamations();
      setReclamations(data);

      setSelectedReclamation((current) => {
        if (!current) {
          return null;
        }
        return data.find((item) => item._id === current._id) ?? null;
      });
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Erreur pendant le chargement des reclamations.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReclamations();
  }, []);

  const filteredReclamations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return reclamations.filter((reclamation) => {
      const matchesSearch =
        !keyword ||
        reclamation.subject.toLowerCase().includes(keyword) ||
        reclamation.ticketNumber.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" || reclamation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reclamations, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReclamations.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedReclamations = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredReclamations.slice(startIndex, startIndex + pageSize);
  }, [filteredReclamations, page]);

  function handleConsult(reclamation: Reclamation) {
    setSelectedReclamation(reclamation);
  }

  function handleAskDelete(reclamation: Reclamation) {
    setDeleteTarget(reclamation);
  }

  function handleCloseDeleteModal() {
    if (isDeleting) {
      return;
    }
    setDeleteTarget(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      setIsDeleting(true);
      setPageError("");
      await deleteReclamation(deleteTarget._id);

      setReclamations((current) =>
        current.filter((reclamation) => reclamation._id !== deleteTarget._id),
      );
      setSelectedReclamation((current) =>
        current?._id === deleteTarget._id ? null : current,
      );
      setDeleteTarget(null);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer la reclamation.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ReclamationDesk
      reclamations={paginatedReclamations}
      allReclamations={reclamations}
      selectedReclamation={selectedReclamation}
      search={search}
      statusFilter={statusFilter}
      page={page}
      totalPages={totalPages}
      totalResults={filteredReclamations.length}
      isLoading={isLoading}
      pageError={pageError}
      onSearchChange={setSearch}
      onStatusChange={setStatusFilter}
      onPageChange={setPage}
      onSelect={handleConsult}
      onDelete={handleAskDelete}
      onRefresh={() => void loadReclamations()}
      onCreate={() => navigate("/user/reclamations/nouvelle")}
      onCloseDetails={() => setSelectedReclamation(null)}
      deleteTarget={deleteTarget}
      isDeleting={isDeleting}
      onCloseDeleteModal={handleCloseDeleteModal}
      onConfirmDelete={() => void handleConfirmDelete()}
    />
  );
}
