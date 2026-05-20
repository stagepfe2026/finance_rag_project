import type { Reclamation, ReclamationReadFilter, ReclamationStatus } from "../../../../models/reclamation";
import ReclamationPageHeader from "./ReclamationPageHeader";
import ReclamationToolbar from "./ReclamationToolbar";
import ReclamationTableBody from "./ReclamationTableBody";
import ReclamationTableHead from "./ReclamationTableHead";
import ReclamationPagination from "./ReclamationPagination";

type ReclamationTableProps = {
  reclamations: Reclamation[];
  search: string;
  statusFilter: ReclamationStatus | "ALL";
  readFilter: ReclamationReadFilter;
  page: number;
  pageSize: number;
  totalPages: number;
  totalResults: number;
  selectedId: string | null;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ReclamationStatus | "ALL") => void;
  onReadFilterChange: (value: ReclamationReadFilter) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onSelect: (reclamation: Reclamation) => void;
  onEdit: (reclamation: Reclamation) => void;
  onDelete: (reclamation: Reclamation) => void;
  onRefresh: () => void;
  onCreate: () => void;
};

export default function ReclamationTable({
  reclamations,
  search,
  statusFilter,
  readFilter,
  page,
  pageSize,
  totalPages,
  totalResults,
  selectedId,
  isLoading,
  onSearchChange,
  onStatusChange,
  onReadFilterChange,
  onResetFilters,
  onPageChange,
  onSelect,
  onEdit,
  onDelete,
  onRefresh,
  onCreate,
}: ReclamationTableProps) {
  const start = totalResults === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalResults);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <ReclamationPageHeader total={totalResults} />

      <ReclamationToolbar
        search={search}
        statusFilter={statusFilter}
        readFilter={readFilter}
        start={start}
        end={end}
        totalResults={totalResults}
        isLoading={isLoading}
        onSearchChange={onSearchChange}
        onStatusChange={onStatusChange}
        onReadFilterChange={onReadFilterChange}
        onResetFilters={onResetFilters}
        onRefresh={onRefresh}
        onCreate={onCreate}
      />

      <div className="min-h-0 flex-1">
        <ReclamationTableHead />
        <ReclamationTableBody
          reclamations={reclamations}
          selectedId={selectedId}
          isLoading={isLoading}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      <ReclamationPagination
        page={page}
        totalPages={totalPages}
        start={start}
        end={end}
        totalResults={totalResults}
        onPageChange={onPageChange}
      />
    </section>
  );
}
