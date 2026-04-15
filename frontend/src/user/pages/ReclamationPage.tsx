import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Reclamation, ReclamationStatus } from "../../models/reclamation";
import { fetchReclamations } from "../../services/reclamation.service";
import ReclamationDetailsPanel from "../components/reclamation/ReclamationDetailsPanel";
import ReclamationsRecentesCard from "../components/reclamation/ReclamationsRecentesCard";
import ReclamationTable from "../components/reclamation/ReclamationTable";

const PAGE_SIZE = 6;

export default function ReclamationPage() {
  const navigate = useNavigate();

  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReclamationStatus | "ALL">("ALL");
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [page, setPage] = useState(1);
  const [pageError, setPageError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
          : "Erreur pendant le chargement des réclamations.",
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

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReclamations.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedReclamations = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredReclamations.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredReclamations, page]);

  return (
    <div className="min-h-[calc(100vh-78px)] bg-[#fcf8f7] ">
      <div className="w-full">
        {pageError ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {pageError}
          </div>
        ) : null}

        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="min-w-0">
            <ReclamationTable
              reclamations={paginatedReclamations}
              search={search}
              statusFilter={statusFilter}
              page={page}
              totalPages={totalPages}
              totalResults={filteredReclamations.length}
              selectedId={selectedReclamation?._id ?? null}
              isLoading={isLoading}
              onSearchChange={setSearch}
              onStatusChange={setStatusFilter}
              onPageChange={setPage}
              onSelect={setSelectedReclamation}
              onRefresh={() => void loadReclamations()}
              onCreate={() => navigate("/user/reclamations/nouvelle")}
            />
          </div>

          <div className="hidden border-l border-[#efe4e1] bg-white xl:block">
            {selectedReclamation ? (
              <ReclamationDetailsPanel
                reclamation={selectedReclamation}
                onClose={() => setSelectedReclamation(null)}
              />
            ) : (
              <ReclamationsRecentesCard
                reclamations={reclamations}
                onSelect={setSelectedReclamation}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}