import { ExternalLink, X } from "lucide-react";

import type { Reclamation } from "../../../../models/reclamation";
import ReclamationStatusBadge from "../shared/ReclamationStatusBadge";

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getProblemLabel(reclamation: Reclamation) {
  return reclamation.problemType === "AUTRE"
    ? reclamation.customProblemType || "Autre"
    : reclamation.problemType;
}

function getPriorityLabel(priority: Reclamation["priority"]) {
  switch (priority) {
    case "LOW":
      return "Basse";
    case "NORMAL":
      return "Normale";
    case "HIGH":
      return "Haute";
    case "URGENT":
      return "Urgente";
    default:
      return priority;
  }
}

type Props = {
  reclamation: Reclamation;
  onClose: () => void;
};

export default function ReclamationDetailsPanel({ reclamation, onClose }: Props) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
  const attachmentUrl = reclamation.attachment?.url ? `${apiBaseUrl}${reclamation.attachment.url}` : null;
  const attachmentIsImage = Boolean(
    reclamation.attachment?.contentType?.startsWith("image/") ||
      reclamation.attachment?.name.match(/\.(png|jpe?g|gif|webp)$/i),
  );

  return (
    <aside className="max-h-[88vh] overflow-y-auto rounded-[24px] border border-[#e8d9d6] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-[#f1e6e3] pb-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#b28a84]">
            Detail reclamation
          </p>
          <h2 className="mt-2 text-[18px] font-semibold text-[#671a12]">
            {reclamation.subject}
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            Ticket: {reclamation.ticketNumber}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfdb] bg-[#faf7f6] text-slate-500 transition hover:text-[#cf3d4c]"
          title="Fermer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-2xl border border-[#f1e6e3] bg-[#fcf8f7] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">Statut</span>
            <ReclamationStatusBadge status={reclamation.status} />
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Type</p>
              <p className="mt-1">{getProblemLabel(reclamation)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Priorite</p>
              <p className="mt-1">{getPriorityLabel(reclamation.priority)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Creation</p>
              <p className="mt-1">{formatDate(reclamation.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Mise a jour</p>
              <p className="mt-1">{formatDate(reclamation.updatedAt)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#f4e8e6] bg-[#fffdfd] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Description</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {reclamation.description}
          </p>
        </div>

        <div className="rounded-2xl border border-[#f4e8e6] bg-[#fffdfd] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Piece jointe</p>
          {reclamation.attachment ? (
            <div className="mt-2 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm text-slate-700">{reclamation.attachment.name}</p>
                {attachmentUrl ? (
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#b03b47] hover:text-[#8f2632]"
                  >
                    Ouvrir
                    <ExternalLink size={12} />
                  </a>
                ) : null}
              </div>
              {attachmentIsImage && attachmentUrl ? (
                <img
                  src={attachmentUrl}
                  alt={reclamation.attachment.name}
                  className="max-h-52 w-full rounded-2xl border border-[#efe2df] object-contain bg-white"
                />
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-700">Aucune piece jointe</p>
          )}
        </div>

        <div className="rounded-2xl border border-[#f4e8e6] bg-[#fffdfd] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Reponse admin</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {reclamation.adminReply || "Aucune reponse pour le moment."}
          </p>
          <div className="mt-3 rounded-2xl bg-[#faf7f6] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Admin traitant</p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {reclamation.adminReplyBy || reclamation.lastUpdatedByAdminName || "Pas encore assigne"}
            </p>
          </div>
          {reclamation.adminReplyAt ? (
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <p>Repondu le {formatDate(reclamation.adminReplyAt)}</p>
              {reclamation.adminReplyBy ? <p>Par {reclamation.adminReplyBy}</p> : null}
              {reclamation.lastUpdatedByAdminAt ? (
                <p>Derniere mise a jour admin: {formatDate(reclamation.lastUpdatedByAdminAt)}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
