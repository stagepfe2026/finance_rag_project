import { ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  start: number;
  end: number;
  totalResults: number;
  onPageChange: (page: number) => void;
};

export default function ReclamationPagination({
  page,
  totalPages,
  start,
  end,
  totalResults,
  onPageChange,
}: Props) {
  return (
    <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5">
      <span className="text-[12px] text-slate-500">
        {start}-{end} sur {totalResults} resultats
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Page precedente des reclamations"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] text-slate-600 transition hover:border-[#9d0208] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Precedent
        </button>

        <span className="rounded-lg bg-[#273043] px-3 py-1.5 text-[12px] font-semibold text-white">
          {page}
        </span>

        <button
          type="button"
          aria-label="Page suivante des reclamations"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] text-slate-600 transition hover:border-[#9d0208] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suivant
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
