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
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#efe4e1] px-5 py-4">
      <p className="text-sm text-[#7b706d]">
        {(safeCurrentPage - 1) * pageSize + 1}-{Math.min(safeCurrentPage * pageSize, filteredCount)} sur {filteredCount} activites
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e3d8d5] bg-white px-3 text-sm text-[#5c5250] transition hover:border-[#9d0208] hover:text-[#9d0208] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronLeft size={14} />
          Precedent
        </button>

        {pageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition ${
              page === safeCurrentPage
                ? "border-[#9d0208] bg-[#9d0208] text-white"
                : "border-[#e3d8d5] bg-white text-[#5c5250] hover:border-[#9d0208] hover:text-[#9d0208]"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage === totalPages}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e3d8d5] bg-white px-3 text-sm text-[#5c5250] transition hover:border-[#9d0208] hover:text-[#9d0208] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Suivant
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
