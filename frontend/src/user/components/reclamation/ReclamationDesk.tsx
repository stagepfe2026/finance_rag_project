import type { ReactNode } from "react";

import type { Reclamation, ReclamationStatus } from "../../../models/reclamation";
import ReclamationDeleteModal from "./list/ReclamationDeleteModal";
import ReclamationDetailsModal from "./list/ReclamationDetailsModal";
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
  isCreating: boolean;
  createForm: ReactNode;
};

function countByStatus(reclamations: Reclamation[], status: Reclamation["status"]) {
  return reclamations.filter((item) => item.status === status).length;
}

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
  isCreating,
  createForm,
}: Props) {
  return (
    <>
      <div className="bg-[#fcf8f7]">
        <div className="mx-auto w-full px-4 py-4">
          {pageError ? (
            <div className="mb-4 rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {pageError}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              {isCreating ? (
                createForm
              ) : (
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
              )}
            </div>

            <div className="space-y-4">
              <aside className="rounded-[12px] border border-[#e8d9d6] bg-white p-5 shadow-sm">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#b28a84]">
                  Synthese
                </p>
                <h2 className="mt-2 text-[18px] font-semibold text-[#671a12]">
                  {isCreating ? "Nouvelle reclamation" : "Vue d ensemble"}
                </h2>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-[10px] bg-[#f2efee] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Total</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-800">{allReclamations.length}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-[10px] bg-amber-50 px-3 py-3 text-center">
                      <p className="text-[11px] font-semibold text-amber-700">Attente</p>
                      <p className="mt-1 text-lg font-semibold text-amber-900">{countByStatus(allReclamations, "PENDING")}</p>
                    </div>
                    <div className="rounded-[10px] bg-[#fff3f1] px-3 py-3 text-center">
                      <p className="text-[11px] font-semibold text-[#b45b52]">En cours</p>
                      <p className="mt-1 text-lg font-semibold text-[#9c4840]">{countByStatus(allReclamations, "IN_PROGRESS")}</p>
                    </div>
                    <div className="rounded-[10px] bg-emerald-50 px-3 py-3 text-center">
                      <p className="text-[11px] font-semibold text-emerald-700">Traitees</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-900">{countByStatus(allReclamations, "RESOLVED")}</p>
                    </div>
                  </div>
                </div>
              </aside>

              {!selectedReclamation ? (
                <aside className="rounded-[12px] border border-[#e8d9d6] bg-white p-5 shadow-sm">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#b28a84]">
                    {isCreating ? "Aide creation" : "Guide"}
                  </p>
                  <h2 className="mt-2 text-[18px] font-semibold text-[#671a12]">
                    {isCreating ? "Completer la demande" : "Creer une reclamation"}
                  </h2>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="rounded-[10px] bg-[#fcf8f7] px-4 py-3">
                      Tous les champs obligatoires doivent etre renseignes.
                    </div>
                    <div className="rounded-[10px] bg-[#fcf8f7] px-4 py-3">
                      La description doit contenir au minimum 7 mots utiles.
                    </div>
                    <div className="rounded-[10px] bg-[#fcf8f7] px-4 py-3">
                      Une piece jointe image ou document est previsualisee et envoyee proprement.
                    </div>
                  </div>
                </aside>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <ReclamationDetailsModal
        reclamation={selectedReclamation}
        open={Boolean(selectedReclamation)}
        onClose={onCloseDetails}
      />

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
