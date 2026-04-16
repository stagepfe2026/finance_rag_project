import type { Reclamation, ReclamationStatus } from "../../../models/reclamation";
import ReclamationDeleteModal from "./list/ReclamationDeleteModal";
import ReclamationDetailsPanel from "./list/ReclamationDetailsPanel";
import ReclamationsRecentesCard from "./list/ReclamationsRecentesCard";
import ReclamationTable from "./list/ReclamationTable";

type Props = {
  reclamations: Reclamation[];
  allReclamations: Reclamation[];
  selectedReclamation: Reclamation | null;
  search: string;
  statusFilter: ReclamationStatus | "ALL";
  page: number;
  totalPages: number;
  totalResults: number;
  isLoading: boolean;
  pageError: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ReclamationStatus | "ALL") => void;
  onPageChange: (page: number) => void;
  onSelect: (reclamation: Reclamation) => void;
  onDelete: (reclamation: Reclamation) => void;
  onRefresh: () => void;
  onCreate: () => void;
  onCloseDetails: () => void;
  deleteTarget: Reclamation | null;
  isDeleting: boolean;
  onCloseDeleteModal: () => void;
  onConfirmDelete: () => void;
};

export default function ReclamationDesk({
  reclamations,
  allReclamations,
  selectedReclamation,
  search,
  statusFilter,
  page,
  totalPages,
  totalResults,
  isLoading,
  pageError,
  onSearchChange,
  onStatusChange,
  onPageChange,
  onSelect,
  onDelete,
  onRefresh,
  onCreate,
  onCloseDetails,
  deleteTarget,
  isDeleting,
  onCloseDeleteModal,
  onConfirmDelete,
}: Props) {
  return (
    <>
      <div className="bg-[#fcf8f7]">
        <div className="mx-auto w-full">
          {pageError ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {pageError}
            </div>
          ) : null}

          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <ReclamationTable
                reclamations={reclamations}
                search={search}
                statusFilter={statusFilter}
                page={page}
                totalPages={totalPages}
                totalResults={totalResults}
                selectedId={selectedReclamation?._id ?? null}
                isLoading={isLoading}
                onSearchChange={onSearchChange}
                onStatusChange={onStatusChange}
                onPageChange={onPageChange}
                onSelect={onSelect}
                onDelete={onDelete}
                onRefresh={onRefresh}
                onCreate={onCreate}
              />
            </div>

            <div className="border-l border-[#eee4e1] bg-white">
              {selectedReclamation ? (
                <ReclamationDetailsPanel
                  reclamation={selectedReclamation}
                  onClose={onCloseDetails}
                />
              ) : (
                <ReclamationsRecentesCard
                  reclamations={allReclamations}
                  onSelect={onSelect}
                />
              )}
            </div>
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
    </>
  );
}
