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
    <section className="min-h-[680px] border border-[#efe4e1] bg-white">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-[17px] font-semibold leading-none text-[#cf3d4c]">
          Mes Réclamations
        </h1>
        <p className="mt-3 text-[13px] text-slate-500">
          Consultez votre liste de réclamations et suivez l'évolution de vos demandes.
        </p>
      </div>

      <div className="border-t border-[#f3e9e6] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex h-11 w-[240px] items-center gap-2 rounded-md border border-[#eadfdb] bg-white px-3">
              <Search size={15} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Rechercher par mot clé ou ticket ..."
                className="w-full bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex h-11 items-center gap-2 rounded-md border border-[#eadfdb] bg-white px-3 text-[13px] text-slate-700">
              <span className="font-medium">Filtrer par statut :</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  onStatusChange(event.target.value as ReclamationStatus | "ALL")
                }
                className="bg-transparent text-[13px] text-slate-500 outline-none"
              >
                <option value="ALL">Tous</option>
                <option value="PENDING">En attente</option>
                <option value="RESOLVED">Résolu</option>
                <option value="FAILED">Échoué</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[13px] text-slate-500">
              {start}–{end} sur {totalResults}
            </span>

            <button
              type="button"
              onClick={onCreate}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-[#cf3d4c] px-4 text-[13px] font-medium text-white transition hover:bg-[#b73645]"
            >
              <Plus size={15} />
              Nouvelle réclamation
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-transparent bg-white text-slate-400 transition hover:text-[#cf3d4c]"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-[#f3e9e6]">
        <div className="grid grid-cols-[2.2fr_1fr_1.25fr_1.25fr_0.8fr] gap-4 px-5 py-4 text-[13px] font-medium text-slate-700">
          <span>Sujet</span>
          <span>Statut</span>
          <span>Date de création</span>
          <span>Dernière mise à jour</span>
          <span className="text-center">Actions</span>
        </div>

        <div className="border-t border-[#f3e9e6]" />

        {reclamations.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
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
                    "grid grid-cols-[2.2fr_1fr_1.25fr_1.25fr_0.8fr] gap-4 border-t border-[#f5ece9] px-5 py-4 text-[13px] transition",
                    active ? "bg-[#fff9fa]" : "bg-white",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-slate-700">
                      {reclamation.subject}
                    </p>
                  </div>

                  <div>
                    <ReclamationStatusBadge status={reclamation.status} />
                  </div>

                  <div className="text-[13px] text-slate-600">
                    {formatDate(reclamation.createdAt)}
                  </div>

                  <div className="text-[13px] text-slate-600">
                    {formatDate(reclamation.updatedAt)}
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelect(reclamation)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#eadfdb] bg-[#fbf8f7] text-slate-500 transition hover:text-[#cf3d4c]"
                      title="Consulter"
                    >
                      <Eye size={15} />
                    </button>

                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#eadfdb] bg-[#fbf8f7] text-slate-500 transition hover:text-rose-600"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[#f3e9e6] px-5 py-4">
        <span className="text-[13px] text-slate-500">
          {start}–{end} sur {totalResults} résultats
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-md border border-[#eadfdb] bg-[#faf7f6] px-4 py-2 text-[13px] text-slate-500 transition hover:border-[#d9c8c2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Précédent
          </button>

          <span className="rounded-md bg-[#cf3d4c] px-4 py-2 text-[13px] font-medium text-white">
            {page}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-2 rounded-md border border-[#eadfdb] bg-[#faf7f6] px-4 py-2 text-[13px] text-slate-500 transition hover:border-[#d9c8c2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Suivant
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}