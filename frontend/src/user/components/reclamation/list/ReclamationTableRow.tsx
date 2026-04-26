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
  const unread = !reclamation.isReplyReadByUser;

  return (
    <div
      onClick={() => onSelect(reclamation)}
      className={[
        "grid cursor-pointer grid-cols-[1.15fr_2.2fr_1fr_1.2fr_1.2fr_0.8fr] gap-4 border-b border-[#f1ebea] px-6 py-4 text-[13px] transition",
        active ? "bg-[#fff5f4]" : "bg-white hover:bg-[#fcf8f7]",
        unread ? "border-l-2 border-l-[#ef4b44]" : "",
      ].join(" ")}
    >
      <div className="flex items-center">
        <p className="truncate rounded-[10px] bg-[#f3efee] px-2.5 py-1 text-[11px] font-semibold text-[#6d6662]">
          {reclamation.ticketNumber}
        </p>
      </div>

      <div className="min-w-0 flex items-center gap-2">
        {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#ef4b44]" /> : null}
        <p className={`truncate text-[13px] ${unread ? "font-semibold text-[#2f2b2a]" : "font-medium text-[#4b4745]"}`}>
          {reclamation.subject}
        </p>
      </div>

      <div className="flex items-center">
        <ReclamationStatusBadge status={reclamation.status} />
      </div>

      <div className="flex items-center text-[13px] text-slate-500">
        {formatDate(reclamation.createdAt)}
      </div>

      <div className="flex items-center text-[13px] text-slate-500">
        {formatDate(reclamation.updatedAt)}
      </div>

      <ReclamationRowActions
        onView={() => onSelect(reclamation)}
        onDelete={() => onDelete(reclamation)}
      />
    </div>
  );
}
