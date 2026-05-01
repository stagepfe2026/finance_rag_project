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
    <div className="shrink-0 flex items-center justify-between border-t border-[#f0e8e5] px-6 py-3">
      <span className="text-[13px] text-slate-500">
        {start}-{end} sur {totalResults} resultats
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-xl border border-[#e2d8d5] bg-[#faf7f6] px-4 py-1.5 text-[13px] text-slate-600 transition hover:border-[#cfc0bb] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Precedent
        </button>

        <span className="rounded-xl bg-[#273043] px-3.5 py-1.5 text-[13px] font-semibold text-white">
          {page}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#e2d8d5] bg-[#faf7f6] px-4 py-1.5 text-[13px] text-slate-600 transition hover:border-[#cfc0bb] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suivant
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
