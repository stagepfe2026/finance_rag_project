import type { Reclamation, ReclamationStatus } from "../../../../models/reclamation";
import ReclamationPageHeader from "./ReclamationPageHeader";
import ReclamationToolbar from "./ReclamationToolbar";
import ReclamationTableBody from "./ReclamationTableBody";
import ReclamationTableHead from "./ReclamationTableHead";
import ReclamationPagination from "./ReclamationPagination";

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
  onDelete: (reclamation: Reclamation) => void;
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
  onDelete,
  onRefresh,
  onCreate,
}: ReclamationTableProps) {
  const start = totalResults === 0 ? 0 : (page - 1) * 6 + 1;
  const end = Math.min(page * 6, totalResults);

  return (
    <section className="min-h-[680px] bg-white">
      <ReclamationPageHeader />

      <ReclamationToolbar
        search={search}
        statusFilter={statusFilter}
        start={start}
        end={end}
        totalResults={totalResults}
        isLoading={isLoading}
        onSearchChange={onSearchChange}
        onStatusChange={onStatusChange}
        onRefresh={onRefresh}
        onCreate={onCreate}
      />

      <div>
        <ReclamationTableHead />
        <ReclamationTableBody
          reclamations={reclamations}
          selectedId={selectedId}
          isLoading={isLoading}
          onSelect={onSelect}
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
