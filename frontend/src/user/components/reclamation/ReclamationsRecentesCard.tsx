import { ChevronRight } from "lucide-react";

import type { Reclamation, ReclamationStatus } from "../../../models/reclamation";
import ReclamationStatusBadge from "./ReclamationStatusBadge";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

// Dot color per status — matches image 3
const dotColor: Record<ReclamationStatus, string> = {
  PENDING: "bg-rose-500",
  RESOLVED: "bg-sky-400",
  FAILED: "bg-amber-400",
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
    <aside className="h-full bg-white p-5">
      <h2 className="text-[15px] font-bold text-slate-800">Réclamations Récentes</h2>

      <div className="mt-4 space-y-4">
        {recentItems.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune réclamation disponible.</p>
        ) : null}

        {recentItems.map((reclamation) => (
          <button
            key={reclamation._id}
            type="button"
            onClick={() => onSelect(reclamation)}
            className="flex w-full items-start gap-3 text-left transition hover:opacity-80"
          >
            {/* Colored dot */}
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

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-[#f0e8e5] pt-4">
        <span className="text-[12px] text-slate-500">
          1–{recentItems.length} sur {total} résultats
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-600 transition hover:text-[#cf3d4c]"
        >
          Voir tout
          <ChevronRight size={13} />
        </button>
      </div>
    </aside>
  );
}