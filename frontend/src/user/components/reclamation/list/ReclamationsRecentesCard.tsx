import { ChevronRight } from "lucide-react";

import type { Reclamation, ReclamationStatus } from "../../../../models/reclamation";
import ReclamationStatusBadge from "../shared/ReclamationStatusBadge";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const dotColor: Record<ReclamationStatus, string> = {
  PENDING: "bg-amber-500",
  IN_PROGRESS: "bg-sky-500",
  RESOLVED: "bg-emerald-500",
  FAILED: "bg-rose-500",
};

type ReclamationsRecentesCardProps = {
  reclamations: Reclamation[];
  onSelect: (reclamation: Reclamation) => void;
};

export default function ReclamationsRecentesCard({
  reclamations,
  onSelect,
}: ReclamationsRecentesCardProps) {
  const recentItems = reclamations.slice(0, 6);
  const total = reclamations.length;

  return (
    <aside className="sticky top-4 rounded-xl border border-[#e8d9d6] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#273043]">
            Reclamations
          </p>
          <h2 className="mt-2 text-[18px] font-bold text-[#273043]">
            Recentes
          </h2>
        </div>
        <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-[12px] font-medium text-[#273043]">
          {total}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {recentItems.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune reclamation disponible.</p>
        ) : null}

        {recentItems.map((reclamation) => (
          <button
            key={reclamation._id}
            type="button"
            onClick={() => onSelect(reclamation)}
            className="flex w-full items-start gap-3 rounded-xl border border-[#f0e5e2] bg-[#fffdfd] px-3 py-3 text-left transition hover:border-[#d8b5b0] hover:bg-[#fcf8f7]"
          >
            <span
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotColor[reclamation.status]}`}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-slate-800">
                {reclamation.subject}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[12px] text-slate-500">
                  {formatDate(reclamation.updatedAt)}
                </span>
                <ReclamationStatusBadge status={reclamation.status} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[#f0e8e5] pt-4">
        <span className="text-[12px] text-slate-500">
          1-{recentItems.length} sur {total} resultats
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-600 transition hover:text-[#9d0208]"
        >
          Voir tout
          <ChevronRight size={13} />
        </button>
      </div>
    </aside>
  );
}
