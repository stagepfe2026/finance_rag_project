import { useEffect, type ReactNode } from "react";

import type { Reclamation, ReclamationReadFilter, ReclamationStatus } from "../../../models/reclamation";
import ReclamationDeleteModal from "./list/ReclamationDeleteModal";
import ReclamationDetailsPanel from "./list/ReclamationDetailsPanel";
import ReclamationTable from "./list/ReclamationTable";

type Props = {
  reclamations: Reclamation[];
  selectedReclamation: Reclamation | null;
  search: string;
  statusFilter: ReclamationStatus | "ALL";
  readFilter: ReclamationReadFilter;
  page: number;
  pageSize: number;
  totalPages: number;
  totalResults: number;
  isLoading: boolean;
  pageError: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ReclamationStatus | "ALL") => void;
  onReadFilterChange: (value: ReclamationReadFilter) => void;
  onPageChange: (page: number) => void;
  onSelect: (reclamation: Reclamation) => void;
  onDelete: (reclamation: Reclamation) => void;
  onRefresh: () => void;
  onCreate: () => void;
  onCloseDetails: () => void;
  onCloseCreate: () => void;
  deleteTarget: Reclamation | null;
  isDeleting: boolean;
  onCloseDeleteModal: () => void;
  onConfirmDelete: () => void;
  isCreating: boolean;
  createForm: ReactNode;
};

export default function ReclamationDesk({
  reclamations,
  selectedReclamation,
  search,
  statusFilter,
  readFilter,
  page,
  pageSize,
  totalPages,
  totalResults,
  isLoading,
  pageError,
  onSearchChange,
  onStatusChange,
  onReadFilterChange,
  onPageChange,
  onSelect,
  onDelete,
  onRefresh,
  onCreate,
  onCloseDetails,
  onCloseCreate,
  deleteTarget,
  isDeleting,
  onCloseDeleteModal,
  onConfirmDelete,
  isCreating,
  createForm,
}: Props) {
  const showDetailsPanel = Boolean(selectedReclamation && !isCreating);

  useEffect(() => {
    if (!isCreating) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseCreate();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCreating, onCloseCreate]);

  return (
    <>
      <div className="h-[calc(100vh-73px)] overflow-hidden bg-slate-50">
        <div className="mx-auto flex h-full w-full flex-col px-4 py-3">
          {pageError ? (
            <div className="mb-3 shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
              {pageError}
            </div>
          ) : null}

          <div
            className={[
              "grid min-h-0 flex-1 gap-3",
              showDetailsPanel ? "xl:grid-cols-[minmax(0,1fr)_340px]" : "grid-cols-1",
            ].join(" ")}
          >
            <div className="min-h-0 min-w-0">
              <ReclamationTable
                reclamations={reclamations}
                search={search}
                statusFilter={statusFilter}
                readFilter={readFilter}
                page={page}
                pageSize={pageSize}
                totalPages={totalPages}
                totalResults={totalResults}
                selectedId={selectedReclamation?._id ?? null}
                isLoading={isLoading}
                onSearchChange={onSearchChange}
                onStatusChange={onStatusChange}
                onReadFilterChange={onReadFilterChange}
                onPageChange={onPageChange}
                onSelect={onSelect}
                onDelete={onDelete}
                onRefresh={onRefresh}
                onCreate={onCreate}
              />
            </div>

            {selectedReclamation && !isCreating ? (
              <ReclamationDetailsPanel
                reclamation={selectedReclamation}
                onClose={onCloseDetails}
              />
            ) : null}
          </div>
        </div>
      </div>

      <ReclamationDeleteModal
        reclamation={deleteTarget}
        open={Boolean(deleteTarget)}
        busy={isDeleting}
        onClose={onCloseDeleteModal}
        onConfirm={onConfirmDelete}
      />

      {isCreating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[rgba(17,24,39,0.58)] px-4 py-5 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label="Fermer la creation de reclamation"
            onClick={onCloseCreate}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative z-10 w-full max-w-[900px]">
            {createForm}
          </div>
        </div>
      ) : null}
    </>
  );
}
