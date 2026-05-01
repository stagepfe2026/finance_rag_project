import { X } from "lucide-react";

import type { Reclamation } from "../../../models/reclamation";
import ReclamationStatusBadge from "./shared/ReclamationStatusBadge";

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

function isImageAttachment(reclamation: Reclamation) {
  return Boolean(reclamation.attachment?.contentType?.startsWith("image/") && reclamation.attachment?.url);
}

type Props = {
  reclamation: Reclamation;
  onClose: () => void;
};

export default function ReclamationDetailsPanel({ reclamation, onClose }: Props) {
  const attachment = reclamation.attachment;
  const imagePreview = isImageAttachment(reclamation);

  return (
    <aside className="sticky top-0 p-5">
      <div className="flex items-start justify-between gap-3 border-b border-[#f1e6e3] pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
            Detail reclamation
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-800">
            {reclamation.subject}
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            Ticket: {reclamation.ticketNumber}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#eadfdb] bg-[#faf7f6] text-slate-500 transition hover:text-[#9d0208]"
          title="Fermer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <div className="rounded-xl border border-[#f1e6e3] bg-[#fcf8f7] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">Statut</span>
            <ReclamationStatusBadge status={reclamation.status} />
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Type</p>
              <p className="mt-1">{getProblemLabel(reclamation)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Priorite</p>
              <p className="mt-1">{reclamation.priority}</p>
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

        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Description</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {reclamation.description}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Piece jointe</p>
          {!attachment ? (
            <p className="mt-2 text-sm text-slate-700">Aucune piece jointe</p>
          ) : imagePreview ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-[#eadfdb] bg-[#fcf8f7] p-2">
              <img
                src={attachment.url ?? undefined}
                alt={attachment.name}
                className="max-h-[320px] w-full rounded-xl object-contain bg-white"
              />
              <div className="mt-3 flex items-center justify-between gap-3 px-1">
                <p className="min-w-0 truncate text-sm text-slate-700">{attachment.name}</p>
                <a
                  href={attachment.url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-sm font-medium text-[#9d0208] hover:underline"
                >
                  Ouvrir
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-2 rounded-xl border border-[#eadfdb] bg-[#fcf8f7] px-4 py-3 text-sm text-slate-700">
              <p>{attachment.name}</p>
              {attachment.url ? (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-medium text-[#9d0208] hover:underline"
                >
                  Ouvrir la piece jointe
                </a>
              ) : null}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Reponse admin</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {reclamation.adminReply || "Aucune reponse pour le moment."}
          </p>
          {reclamation.adminReplyAt ? (
            <p className="mt-2 text-xs text-slate-500">
              Repondu le {formatDate(reclamation.adminReplyAt)}
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
