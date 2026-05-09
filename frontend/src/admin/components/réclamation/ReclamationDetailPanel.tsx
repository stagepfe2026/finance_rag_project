import { ExternalLink, Maximize2, Minimize2, X } from "lucide-react";
import type { Reclamation } from "../../../models/reclamation";
import {
  formatDate,
  formatSlaRemaining,
  getPriorityLabel,
  getSlaStatusClassName,
  getSlaStatusLabel,
  getStatusClassName,
  getStatusLabel,
} from "./reclamationHelpers";
import ReclamationReplyBox from "./ReclamationReplyBox";

type ReclamationDetailPanelProps = {
  apiBaseUrl: string;
  reclamation: Reclamation;
  liveStatus: Reclamation["status"];
  isExpanded: boolean;
  adminReply: string;
  alreadyHandled: boolean;
  isSubmitting: boolean;
  isTaking: boolean;
  onToggleExpanded: () => void;
  onClose: () => void;
  onReplyChange: (value: string) => void;
  onSubmitReply: () => void;
  onTakeReclamation: () => void;
};

export default function ReclamationDetailPanel({
  apiBaseUrl,
  reclamation,
  liveStatus,
  isExpanded,
  adminReply,
  alreadyHandled,
  isSubmitting,
  isTaking,
  onToggleExpanded,
  onClose,
  onReplyChange,
  onSubmitReply,
  onTakeReclamation,
}: ReclamationDetailPanelProps) {
  const canTake = reclamation.status === "PENDING";

  return (
    <aside
      className={`flex h-full flex-col overflow-hidden border border-[#dde3ed] rounded rounded-lg bg-white ${
        isExpanded ? "w-[580px]" : "w-[460px]"
      }`}
    >
      {/* HEADER */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-[#dde3ed] bg-[#f8fafc] px-3.5 py-2.5">
        <div>
          <p className="text-[11px] font-bold tracking-wide text-[#071f3d]">
            #{reclamation.ticketNumber}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={onToggleExpanded}
            className="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded border border-[#dde3ed] text-[#8a96ad] hover:border-[#9d0208] hover:text-[#9d0208]"
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button
            onClick={onClose}
            className="flex h-[26px] cursor-pointer w-[26px] items-center justify-center rounded border border-[#dde3ed] text-[#8a96ad] hover:border-[#9d0208] hover:text-[#9d0208]"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* SUBJECT + STATUS */}
      <div className="flex flex-shrink-0 items-start justify-between gap-2 border-b border-[#eef2f7] px-3.5 py-2">
        <p className="text-[13px] font-bold leading-snug text-[#071f3d]">
          {reclamation.subject}
        </p>
        <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusClassName(liveStatus)}`}>
          {getStatusLabel(liveStatus)}
        </span>
      </div>

      {/* EMAIL */}
      <div className="flex-shrink-0 border-b border-[#f0f3f8] bg-[#fcfdfe] px-3.5 py-1 text-[10px] text-[#8a96ad]">
        {reclamation.userEmail}
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto">

        {/* TAKE ACTION BANNER */}
        {canTake && (
          <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-[#f0f3f8] bg-amber-50 px-3.5 py-2">
            <p className="text-[11px] text-amber-800">
              Cette reclamation est en attente de prise en charge.
            </p>
            <button
              type="button"
              onClick={onTakeReclamation}
              disabled={isTaking}
              className="shrink-0 rounded bg-[#9d0208] cursor-pointer px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-[#7b0206] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isTaking ? "En cours..." : "Prendre en charge"}
            </button>
          </div>
        )}

        {/* METADATA */}
        <div className="border-b border-[#f0f3f8] px-3.5 py-2.5">
          <p className="mb-2 text-xs font-bold uppercase text-[#9d0208]">
            Informations
          </p>
          <div className="grid grid-cols-3 gap-y-2">
            <div>
              <p className="text-[10px] text-[#8a96ad]">Priorite</p>
              <p className="mt-0.5 text-[12px] font-semibold text-[#071f3d]">
                {getPriorityLabel(reclamation.priority)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#8a96ad]">Cree le</p>
              <p className="mt-0.5 text-[12px] font-semibold text-[#071f3d]">
                {formatDate(reclamation.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#8a96ad]">Pris en charge par</p>
              <p className="mt-0.5 truncate text-[12px] font-semibold text-[#071f3d]">
                {reclamation.takenByAdminName ?? reclamation.adminReplyBy ?? "—"}
              </p>
            </div>
            {reclamation.takenAt && (
              <div>
                <p className="text-[10px] text-[#8a96ad]">Prise en charge le</p>
                <p className="mt-0.5 text-[12px] font-semibold text-[#071f3d]">
                  {formatDate(reclamation.takenAt)}
                </p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-[10px] text-[#8a96ad]">SLA</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${getSlaStatusClassName(reclamation.slaStatus)}`}>
                  {getSlaStatusLabel(reclamation.slaStatus)}
                </span>
                {reclamation.slaRemainingMinutes !== null && reclamation.slaRemainingMinutes > 0 && (
                  <span className="text-[10px] text-[#8a96ad]">
                    {formatSlaRemaining(reclamation.slaRemainingMinutes)} restantes
                  </span>
                )}
                {reclamation.isSlaOverdue && reclamation.slaDelayMinutes !== null && reclamation.slaDelayMinutes > 0 && (
                  <span className="text-[10px] text-rose-600">
                    +{formatSlaRemaining(reclamation.slaDelayMinutes)} de retard
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* DESCRIPTION + ATTACHMENT side by side */}
        <div className="border-b border-[#f0f3f8] px-3.5 py-2.5">
          <p className="mb-2 text-xs font-bold uppercase text-[#9d0208]">
            Description {reclamation.attachment?.url && "& Piece jointe"}
          </p>
          <div className={reclamation.attachment?.url ? "grid grid-cols-2 gap-3 items-start" : ""}>
            <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-[#4f5b76]">
              {reclamation.description}
            </p>
            {reclamation.attachment?.url && (
              <div className="rounded border border-[#eef2f7] bg-[#fafbfd] p-2.5">
                <p className="mb-1.5 text-[10px] text-[#8a96ad]">Fichier joint</p>
                <a
                  href={`${apiBaseUrl}${reclamation.attachment.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#9d0208] hover:underline"
                >
                  Ouvrir <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* HISTORY */}
        <div className="border-b border-[#f0f3f8] px-3.5 py-2.5">
          <p className="mb-2 text-xs font-bold uppercase text-[#9d0208]">
            Historique
          </p>
          <div>
            {reclamation.activityLog.map((entry) => (
              <div key={entry.id} className="flex gap-2 border-b border-[#f5f7fa] py-1.5 last:border-0">
                <div className="mt-[5px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#9d0208]" />
                <div>
                  <p className="text-[12px] leading-snug text-[#2f3a52]">{entry.description}</p>
                  <p className="mt-0.5 text-[10px] text-[#8a96ad]">
                    {entry.actorName} · {formatDate(entry.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REPLY */}
        <div className="px-3.5 py-2.5">
          <p className="mb-2 text-xs font-bold uppercase text-[#9d0208]">
            Reponse administrative
          </p>
          <ReclamationReplyBox
            adminReply={adminReply}
            alreadyHandled={alreadyHandled}
            adminReplyBy={reclamation.adminReplyBy}
            isSubmitting={isSubmitting}
            onReplyChange={onReplyChange}
            onSubmit={onSubmitReply}
          />
        </div>

      </div>
    </aside>
  );
}
