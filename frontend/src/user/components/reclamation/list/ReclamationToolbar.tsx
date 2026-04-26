import { Plus, RefreshCw, Search } from "lucide-react";

import type { ReclamationStatus } from "../../../../models/reclamation";

type Props = {
  search: string;
  statusFilter: ReclamationStatus | "ALL";
  start: number;
  end: number;
  totalResults: number;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ReclamationStatus | "ALL") => void;
  onRefresh: () => void;
  onCreate: () => void;
};

export default function ReclamationToolbar({
  search,
  statusFilter,
  start,
  end,
  totalResults,
  isLoading,
  onSearchChange,
  onStatusChange,
  onRefresh,
  onCreate,
}: Props) {
  return (
    <div className="px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 w-[260px] items-center gap-2 rounded-[10px] border border-[#d8d3d0] bg-white px-3 text-[13px]">
            <Search size={14} className="shrink-0 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Rechercher par mot cle ou ticket ..."
              className="w-full bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#d8d3d0] bg-white px-3 text-[13px]">
            <span className="font-medium text-slate-700">Statut :</span>
            <select
              value={statusFilter}
              onChange={(event) => onStatusChange(event.target.value as ReclamationStatus | "ALL")}
              className="bg-transparent text-[13px] text-slate-500 outline-none"
            >
              <option value="ALL">Tous</option>
              <option value="PENDING">En attente</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="RESOLVED">Traitee</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate-500">
            {start}-{end} sur {totalResults}
          </span>

          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#ef4b44] px-3.5 text-[13px] font-semibold text-white transition hover:bg-[#d9423c]"
          >
            <Plus size={14} />
            Nouvelle reclamation
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#d8d3d0] bg-white text-slate-400 transition hover:text-[#8f2632]"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}
