import { CheckCircle2, Circle, ExternalLink, Info, X } from "lucide-react";
import type { ReactNode } from "react";

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

function formatShortDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
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

function getStatusLabel(status: Reclamation["status"]) {
  switch (status) {
    case "PENDING":
      return "En attente";
    case "IN_PROGRESS":
      return "En cours";
    case "RESOLVED":
      return "Traitee";
    case "FAILED":
      return "A revoir";
    default:
      return status;
  }
}

function getHistoryItems(reclamation: Reclamation) {
  const items = [];

  if (reclamation.adminReplyAt || reclamation.status === "RESOLVED") {
    items.push({
      title: "Reclamation traitee",
      date: reclamation.adminReplyAt || reclamation.updatedAt,
      actor: reclamation.adminReplyBy || reclamation.lastUpdatedByAdminName || "Systeme Admin",
      tone: "success" as const,
    });
  }

  if (reclamation.status === "IN_PROGRESS" || reclamation.status === "RESOLVED") {
    items.push({
      title: "En cours de traitement",
      date: reclamation.lastUpdatedByAdminAt || reclamation.updatedAt,
      actor: reclamation.lastUpdatedByAdminName || "Systeme Admin",
      tone: "info" as const,
    });
  }

  items.push({
    title: "Reclamation creee",
    date: reclamation.createdAt,
    actor: "Vous",
    tone: "neutral" as const,
  });

  return items;
}

type FieldProps = {
  label: string;
  children: ReactNode;
};

function DetailField({ label, children }: FieldProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      <div className="mt-2 text-[12px] leading-5 text-[#273043]">{children}</div>
    </div>
  );
}

type Props = {
  reclamation: Reclamation;
  onClose: () => void;
};

export default function ReclamationDetailsPanel({ reclamation, onClose }: Props) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
  const attachmentUrl = reclamation.attachment?.url ? `${apiBaseUrl}${reclamation.attachment.url}` : null;
  const unread = Boolean(reclamation.adminReply) && !reclamation.isReplyReadByUser;
  const historyItems = getHistoryItems(reclamation);

  return (
    <aside className="sticky top-[88px] h-[calc(100vh-104px)] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 pb-4 pt-5">
        <h2 className="text-[15px] font-semibold text-[#273043]">
          Detail de la reclamation
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#9d0208]"
          aria-label="Fermer le detail de la reclamation"
          title="Fermer"
        >
          <X size={17} />
        </button>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div>
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold",
              unread ? "bg-red-50 text-[#9d0208]" : "bg-slate-100 text-slate-600",
            ].join(" ")}
          >
            {getStatusLabel(reclamation.status)}
            {unread ? (
              <>
                <span>- Non lue</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#9d0208]" />
              </>
            ) : null}
          </span>
        </div>

        <DetailField label="Ticket">
          <span className="inline-flex rounded-full bg-[#f3efee] px-2.5 py-1 text-[11px] font-semibold text-[#6d6662]">
            {reclamation.ticketNumber}
          </span>
        </DetailField>

        <DetailField label="Sujet">
          <p className="font-semibold">{reclamation.subject}</p>
        </DetailField>

        <DetailField label="Statut">
          <ReclamationStatusBadge status={reclamation.status} />
        </DetailField>

        <div className="grid grid-cols-2 gap-4">
          <DetailField label="Date de creation">
            {formatDate(reclamation.createdAt)}
          </DetailField>
          <DetailField label="Mise a jour">
            {formatDate(reclamation.updatedAt)}
          </DetailField>
        </div>

        <DetailField label="Type">
          {getProblemLabel(reclamation)}
        </DetailField>

        <DetailField label="Priorite">
          {getPriorityLabel(reclamation.priority)}
        </DetailField>

        <DetailField label="Description">
          <div className="min-h-[56px] whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-3 text-slate-600">
            {reclamation.description}
          </div>
        </DetailField>

        {reclamation.attachment ? (
          <DetailField label="Piece jointe">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="min-w-0 truncate">{reclamation.attachment.name}</span>
              {attachmentUrl ? (
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-[#9d0208]"
                  title="Ouvrir la piece jointe"
                >
                  <ExternalLink size={14} />
                </a>
              ) : null}
            </div>
          </DetailField>
        ) : null}

        <DetailField label="Derniere reponse du systeme">
          <div className="rounded-xl bg-emerald-50 px-3 py-3 text-emerald-700">
            <p className="whitespace-pre-wrap">
              {reclamation.adminReply || "Aucune reponse pour le moment."}
            </p>
            {reclamation.adminReplyAt ? (
              <p className="mt-2 text-[11px] text-emerald-600">
                {formatDate(reclamation.adminReplyAt)}
              </p>
            ) : null}
          </div>
        </DetailField>

        <div>
          <p className="text-[11px] font-semibold text-slate-500">Historique</p>
          <div className="mt-3 space-y-4">
            {historyItems.map((item, index) => {
              const isSuccess = item.tone === "success";
              const isInfo = item.tone === "info";

              return (
                <div key={`${item.title}-${item.date}`} className="relative flex gap-3">
                  {index < historyItems.length - 1 ? (
                    <span className="absolute left-[13px] top-7 h-[calc(100%+8px)] w-px bg-slate-200" />
                  ) : null}

                  <span
                    className={[
                      "relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-white",
                      isSuccess
                        ? "border-emerald-200 text-emerald-600"
                        : isInfo
                          ? "border-blue-200 text-blue-600"
                          : "border-slate-200 text-slate-400",
                    ].join(" ")}
                  >
                    {isSuccess ? <CheckCircle2 size={15} /> : isInfo ? <Info size={15} /> : <Circle size={13} />}
                  </span>

                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#273043]">{item.title}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatShortDate(item.date)} a {formatTime(item.date)}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">{item.actor}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
