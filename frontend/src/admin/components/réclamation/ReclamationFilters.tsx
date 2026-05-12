import {
  reclamationPriorityLabels,
  reclamationProblemTypeLabels,
  type Reclamation,
  type ReclamationPriority,
  type ReclamationProblemType,
} from "../../../models/reclamation";
import ReclamationSearchBar from "./ReclamationSearchBar";

type StatusFilter = "ALL" | Extract<Reclamation["status"], "PENDING" | "IN_PROGRESS" | "RESOLVED">;
type CategoryFilter = "ALL" | ReclamationProblemType;
type PriorityFilter = "ALL" | ReclamationPriority;

type ReclamationFiltersProps = {
  search: string;
  statusFilter: StatusFilter;
  categoryFilter: CategoryFilter;
  priorityFilter: PriorityFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onCategoryFilterChange: (value: CategoryFilter) => void;
  onPriorityFilterChange: (value: PriorityFilter) => void;
  onResetFilters: () => void;
};

export default function ReclamationFilters({
  search,
  statusFilter,
  categoryFilter,
  priorityFilter,
  onSearchChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onPriorityFilterChange,
  onResetFilters,
}: ReclamationFiltersProps) {
  const hasFilters = search.trim() || statusFilter !== "ALL" || categoryFilter !== "ALL" || priorityFilter !== "ALL";

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

      <select
        value={categoryFilter}
        onChange={(event) => onCategoryFilterChange(event.target.value as CategoryFilter)}
        className="h-9 rounded border border-[#e5eaf2] bg-white px-3 text-[12px] font-semibold text-[#071f3d] outline-none"
      >
        <option value="ALL">Toutes les categories</option>
        {Object.entries(reclamationProblemTypeLabels).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <select
        value={priorityFilter}
        onChange={(event) => onPriorityFilterChange(event.target.value as PriorityFilter)}
        className="h-9 rounded border border-[#e5eaf2] bg-white px-3 text-[12px] font-semibold text-[#071f3d] outline-none"
      >
        <option value="ALL">Toutes les urgences</option>
        {Object.entries(reclamationPriorityLabels).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <button
        type="button"
        onClick={onResetFilters}
        disabled={!hasFilters}
        className="h-9 rounded border border-[#e5eaf2] bg-white px-3 text-[12px] font-semibold text-[#071f3d] transition hover:border-[#9d0208] disabled:cursor-not-allowed disabled:opacity-45"
      >
        Reinitialiser
      </button>
    </div>
  );
}
