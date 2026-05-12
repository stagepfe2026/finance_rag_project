import { Plus, RefreshCw, RotateCcw, Search } from "lucide-react";

import type { ReclamationReadFilter, ReclamationStatus } from "../../../../models/reclamation";

type Props = {
  search: string;
  statusFilter: ReclamationStatus | "ALL";
  readFilter: ReclamationReadFilter;
  start: number;
  end: number;
  totalResults: number;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ReclamationStatus | "ALL") => void;
  onReadFilterChange: (value: ReclamationReadFilter) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onCreate: () => void;
};

const readFilterOptions: Array<{ value: ReclamationReadFilter; label: string }> = [
  { value: "ALL", label: "Toutes" },
  { value: "READ", label: "Lues" },
  { value: "UNREAD", label: "Non lues" },
];

export default function ReclamationToolbar({
  search,
  statusFilter,
  readFilter,
  start,
  end,
  totalResults,
  isLoading,
  onSearchChange,
  onStatusChange,
  onReadFilterChange,
  onResetFilters,
  onRefresh,
  onCreate,
}: Props) {
  const hasFilters = Boolean(search.trim()) || statusFilter !== "ALL" || readFilter !== "ALL";

  return (
    <div className="shrink-0 border-b border-slate-200 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 w-[250px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] transition focus-within:border-[#9d0208] focus-within:bg-white">
            <Search size={14} className="shrink-0 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Rechercher par mot cle ou ticket ..."
              className="w-full bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px]">
            <span className="font-medium text-slate-700">Statut :</span>
            <select
              value={statusFilter}
              onChange={(event) => onStatusChange(event.target.value as ReclamationStatus | "ALL")}
              className="cursor-pointer bg-transparent text-[12px] text-slate-500 outline-none"
            >
              <option value="ALL">Tous</option>
              <option value="PENDING">En attente</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="RESOLVED">Traitee</option>
            </select>
          </div>

          <div className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-[12px]">
            <span className="px-2 font-medium text-slate-700">Lecture :</span>
            {readFilterOptions.map((option) => {
              const isActive = readFilter === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onReadFilterChange(option.value)}
                  aria-pressed={isActive}
                  className={[
                    "inline-flex h-7 cursor-pointer items-center rounded-md px-2.5 text-[12px] font-semibold transition",
                    isActive
                      ? "bg-[#9d0208] text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-[#273043]",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onResetFilters}
            disabled={!hasFilters}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 transition hover:border-[#9d0208] hover:text-[#273043] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RotateCcw size={13} />
            Reinitialiser
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate-500">
            {start}-{end} sur {totalResults}
          </span>

          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#273043] px-3 text-[12px] font-semibold text-white transition hover:bg-[#1f2636]"
          >
            <Plus size={14} />
            Nouvelle reclamation
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition hover:border-[#9d0208] hover:text-[#273043]"
            title="Actualiser"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}
