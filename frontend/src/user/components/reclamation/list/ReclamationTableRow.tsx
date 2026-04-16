import type { Reclamation } from "../../../../models/reclamation";
import ReclamationStatusBadge from "../shared/ReclamationStatusBadge";
import ReclamationRowActions from "./ReclamationRowActions";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type Props = {
  reclamation: Reclamation;
  active: boolean;
  onSelect: (reclamation: Reclamation) => void;
  onDelete: (reclamation: Reclamation) => void;
};

export default function ReclamationTableRow({
  reclamation,
  active,
  onSelect,
  onDelete,
}: Props) {
  return (
    <div
      className={[
        "grid grid-cols-[2.4fr_1fr_1.3fr_1.3fr_0.7fr] gap-4 border-b border-[#f5ede9] px-6 py-4 text-[13px] transition",
        active ? "bg-rose-50/40" : "bg-white hover:bg-[#fdf9f9]",
      ].join(" ")}
    >
      <div className="min-w-0 flex items-center">
        <p className="truncate text-[13px] font-medium text-slate-700">
          {reclamation.subject}
        </p>
      </div>

      <div className="flex items-center">
        <ReclamationStatusBadge status={reclamation.status} />
      </div>

      <div className="flex items-center text-[13px] text-slate-600">
        {formatDate(reclamation.createdAt)}
      </div>

      <div className="flex items-center text-[13px] text-slate-600">
        {formatDate(reclamation.updatedAt)}
      </div>

      <ReclamationRowActions
        onView={() => onSelect(reclamation)}
        onDelete={() => onDelete(reclamation)}
      />
    </div>
  );
}
