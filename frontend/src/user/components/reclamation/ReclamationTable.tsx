import { Eye, Plus, RefreshCw, Search, Trash2, ChevronRight } from "lucide-react";

import type { Reclamation, ReclamationStatus } from "../../../models/reclamation";
import ReclamationStatusBadge from "./ReclamationStatusBadge";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type ReclamationTableProps = {
  reclamations: Reclamation[];
  search: string;
  statusFilter: ReclamationStatus | "ALL";
  page: number;
  totalPages: number;
  totalResults: number;
  selectedId: string | null;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ReclamationStatus | "ALL") => void;
  onPageChange: (page: number) => void;
  onSelect: (reclamation: Reclamation) => void;
  onRefresh: () => void;
  onCreate: () => void;
};

export default function ReclamationTable({
  reclamations,
  search,
  statusFilter,
  page,
  totalPages,
  totalResults,
  selectedId,
  isLoading,
  onSearchChange,
  onStatusChange,
  onPageChange,
  onSelect,
  onRefresh,
  onCreate,
}: ReclamationTableProps) {
  const start = totalResults === 0 ? 0 : (page - 1) * 6 + 1;
  const end = Math.min(page * 6, totalResults);

  return (
    <section className="min-h-[680px] bg-white">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-[18px] font-bold leading-none text-[#cf3d4c]">
          Mes Réclamations
        </h1>
        <p className="mt-2 text-[13px] text-slate-500">
          Consultez votre liste de réclamations et suivez l'évolution de vos demandes.
        </p>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Search + Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="flex h-9 w-[260px] items-center gap-2 rounded-md border border-[#e2d8d5] bg-white px-3 text-[13px]">
              <Search size={14} className="shrink-0 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Rechercher par mot clé ou ticket ..."
                className="w-full bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Status filter */}
            <div className="flex h-9 items-center gap-1.5 rounded-md border border-[#e2d8d5] bg-white px-3 text-[13px]">
              <span className="font-medium text-slate-700">Filtrer par statut :</span>
              <select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value as ReclamationStatus | "ALL")}
                className="bg-transparent text-[13px] text-slate-500 outline-none"
              >
                <option value="ALL">Tous</option>
                <option value="PENDING">En attente</option>
                <option value="RESOLVED">Résolu</option>
                <option value="FAILED">En cours</option>
              </select>
            </div>
          </div>

          {/* Right: count + buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-slate-500">
              {start}–{end} sur {totalResults}
            </span>

            <button
              type="button"
              onClick={onCreate}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#cf3d4c] px-2 text-[13px] font-semibold text-white transition hover:bg-[#b73645]"
            >
              <Plus size={14} />
              Nouvelle réclamation
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#e2d8d5] bg-white text-slate-400 transition hover:text-[#cf3d4c]"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        {/* Column headers */}
        <div className="grid grid-cols-[2.4fr_1fr_1.3fr_1.3fr_0.7fr] gap-4 border-t border-b border-[#f0e8e5] px-6 py-3 text-[13px] font-semibold text-slate-700">
          <span>Sujet</span>
          <span>Statut</span>
          <span>Date de création</span>
          <span>Dernière mise à jour</span>
          <span className="text-center">Actions</span>
        </div>

        {/* Rows */}
        {reclamations.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            {isLoading ? "Chargement des réclamations..." : "Aucune réclamation trouvée."}
          </div>
        ) : (
          <div>
            {reclamations.map((reclamation) => {
              const active = selectedId === reclamation._id;
              return (
                <div
                  key={reclamation._id}
                  className={[
                    "grid grid-cols-[2.4fr_1fr_1.3fr_1.3fr_0.7fr] gap-4 border-b border-[#f5ede9] px-6 py-4 text-[13px] transition",
                    active ? "bg-rose-50/40" : "bg-white hover:bg-[#fdf9f9]",
                  ].join(" ")}
                >
                  <div className="min-w-0 flex items-center">
                    <p className="truncate text-[13px] font-medium text-slate-700">
                      {reclamation.subject}
                    </p>
                  </div>

                  <div className="flex items-center">
                    <ReclamationStatusBadge status={reclamation.status} />
                  </div>

                  <div className="flex items-center text-[13px] text-slate-600">
                    {formatDate(reclamation.createdAt)}
                  </div>

                  <div className="flex items-center text-[13px] text-slate-600">
                    {formatDate(reclamation.updatedAt)}
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelect(reclamation)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#e8ddd9] bg-[#faf7f6] text-slate-500 transition hover:text-[#cf3d4c]"
                      title="Consulter"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#e8ddd9] bg-[#faf7f6] text-slate-500 transition hover:text-rose-600"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between border-t border-[#f0e8e5] px-6 py-4">
        <span className="text-[13px] text-slate-500">
          {start}–{end} sur {totalResults} résultats
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-md border border-[#e2d8d5] bg-[#faf7f6] px-4 py-1.5 text-[13px] text-slate-600 transition hover:border-[#cfc0bb] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Précédent
          </button>

          <span className="rounded-md bg-[#cf3d4c] px-3.5 py-1.5 text-[13px] font-semibold text-white">
            {page}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#e2d8d5] bg-[#faf7f6] px-4 py-1.5 text-[13px] text-slate-600 transition hover:border-[#cfc0bb] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Suivant
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}