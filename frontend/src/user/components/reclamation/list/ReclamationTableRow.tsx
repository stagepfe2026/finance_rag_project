import type { Reclamation } from "../../../../models/reclamation";
import ReclamationStatusBadge from "../shared/ReclamationStatusBadge";
import ReclamationRowActions from "./ReclamationRowActions";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
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
  const unread = Boolean(reclamation.adminReply) && !reclamation.isReplyReadByUser;
  const activityDate = reclamation.adminReplyAt || reclamation.updatedAt;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(reclamation)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(reclamation);
        }
      }}
      className={[
        "grid min-h-[78px] cursor-pointer grid-cols-[1.15fr_2.25fr_0.95fr_1.1fr_1.1fr_0.75fr] gap-4 border-b border-[#eef0f3] px-6 py-3 text-[13px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#9d0208]",
        active ? "bg-slate-50" : "bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-center">
        <p className="truncate rounded-xl bg-[#f3efee] px-2.5 py-1 text-[11px] font-semibold text-[#6d6662]">
          {reclamation.ticketNumber}
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#9d0208]" /> : null}
          <p className={`truncate text-[13px] ${unread ? "font-semibold text-[#273043]" : "font-medium text-[#4b4745]"}`}>
            {reclamation.subject}
          </p>
        </div>

        {unread ? (
          <span className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-[#9d0208]">
            Traitee - Non lue
          </span>
        ) : null}

        <p className="mt-1 truncate text-[12px] text-slate-500">
          {reclamation.adminReply ? "Nouvelle reponse du systeme" : "Demande envoyee"}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          le {formatDate(activityDate)} a {formatTime(activityDate)}
        </p>
      </div>

      <div className="flex items-center">
        <ReclamationStatusBadge status={reclamation.status} />
      </div>

      <div className="flex flex-col justify-center text-[13px] text-slate-500">
        <span>{formatDate(reclamation.createdAt)}</span>
        <span>{formatTime(reclamation.createdAt)}</span>
      </div>

      <div className="flex flex-col justify-center text-[13px] text-slate-500">
        <span>{formatDate(reclamation.updatedAt)}</span>
        <span>{formatTime(reclamation.updatedAt)}</span>
      </div>

      <ReclamationRowActions
        onView={() => onSelect(reclamation)}
        onDelete={() => onDelete(reclamation)}
      />
    </div>
  );
}
