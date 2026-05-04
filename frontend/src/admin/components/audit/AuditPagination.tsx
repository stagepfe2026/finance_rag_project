import { ChevronLeft, ChevronRight } from "lucide-react";

type AuditPaginationProps = {
  safeCurrentPage: number;
  totalPages: number;
  pageNumbers: number[];
  filteredCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export default function AuditPagination({
  safeCurrentPage,
  totalPages,
  pageNumbers,
  filteredCount,
  pageSize,
  onPageChange,
}: AuditPaginationProps) {
  const firstItem = filteredCount === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5eaf2] px-4 py-3">
      <p className="text-[12px] text-[#5f6680]">
        {firstItem}-{Math.min(safeCurrentPage * pageSize, filteredCount)} sur {filteredCount} activités
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1}
          className="inline-flex h-8 items-center gap-1.5 rounded border border-[#e5eaf2] bg-white px-2.5 text-[11px] font-semibold text-[#071f3d] transition hover:border-[#071f3d] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronLeft size={14} />
          Précédent
        </button>

        {pageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded border text-[11px] font-semibold transition ${
              page === safeCurrentPage
                ? "border-[#9d0208] bg-[#9d0208] text-white"
                : "border-[#e5eaf2] bg-white text-[#071f3d] hover:border-[#071f3d]"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage === totalPages}
          className="inline-flex h-8 items-center gap-1.5 rounded border border-[#e5eaf2] bg-white px-2.5 text-[11px] font-semibold text-[#071f3d] transition hover:border-[#071f3d] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Suivant
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
