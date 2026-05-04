import type { Reclamation } from "../../../models/reclamation";
import ReclamationSearchBar from "./ReclamationSearchBar";

type StatusFilter = "ALL" | Extract<Reclamation["status"], "PENDING" | "IN_PROGRESS" | "RESOLVED">;

type ReclamationFiltersProps = {
  search: string;
  statusFilter: StatusFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
};

export default function ReclamationFilters({
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
}: ReclamationFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[#e5eaf2] px-4 py-3">
      <ReclamationSearchBar value={search} onChange={onSearchChange} />

      <select
        value={statusFilter}
        onChange={(event) => onStatusFilterChange(event.target.value as StatusFilter)}
        className="h-9 rounded border border-[#e5eaf2] bg-white px-3 text-[12px] font-semibold text-[#071f3d] outline-none"
      >
        <option value="ALL">Tous les statuts</option>
        <option value="PENDING">En attente</option>
        <option value="IN_PROGRESS">En cours</option>
        <option value="RESOLVED">Traitees</option>
      </select>
    </div>
  );
}
