import { X } from "lucide-react";

import type { AuditActivity } from "../../../models/audit";
import AuditExportMenu from "./AuditExportMenu";
import { buildActivityPayload, formatDateTime, getActionClassName, getCategoryClassName, getRoleLabel } from "./auditHelpers";

type AuditDetailPanelProps = {
  activity: AuditActivity | null;
  onClose: () => void;
};

export default function AuditDetailPanel({ activity, onClose }: AuditDetailPanelProps) {
  if (!activity) {
    return null;
  }

  const payloadJson = buildActivityPayload(activity);

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-[min(100vw,460px)] flex-col overflow-hidden border border-[#dde3ed] bg-white shadow-[-14px_0_34px_rgba(7,31,61,0.12)]">

      {/* HEADER */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-[#dde3ed] bg-[#f8fafc] px-3.5 py-2.5">
        <p className="text-[11px] font-bold tracking-wide text-[#071f3d]">Détail de l'activité</p>
        <button
          type="button"
          aria-label="Fermer le detail du log"
          onClick={onClose}
          className="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded border border-[#dde3ed] text-[#8a96ad] hover:border-[#9d0208] hover:text-[#9d0208]"
        >
          <X size={12} />
        </button>
      </div>

      {/* ACTION LABEL + CATEGORY */}
      <div className="flex flex-shrink-0 items-start justify-between gap-2 border-b border-[#eef2f7] px-3.5 py-2">
        <p className="text-[13px] font-bold leading-snug text-[#071f3d]">{activity.actionLabel}</p>
        <span className={`mt-0.5 shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold ${getCategoryClassName(activity.category)}`}>
          {activity.category}
        </span>
      </div>

      {/* DATE */}
      <div className="flex-shrink-0 border-b border-[#f0f3f8] bg-[#fcfdfe] px-3.5 py-1 text-[10px] text-[#8a96ad]">
        {formatDateTime(activity.occurredAt)}
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto">

        {/* UTILISATEUR */}
        <div className="border-b border-[#f0f3f8] px-3.5 py-2.5">
          <p className="mb-2 text-xs font-bold uppercase text-[#9d0208]">Utilisateur</p>
          <div className="grid grid-cols-3 gap-y-2">
            <div className="col-span-2">
              <p className="text-[10px] text-[#8a96ad]">Identifiant</p>
              <p className="mt-0.5 break-words text-[12px] font-semibold text-[#071f3d]">
                {activity.userEmail || activity.userId || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#8a96ad]">Role</p>
              <p className="mt-0.5 text-[12px] font-semibold text-[#071f3d]">{getRoleLabel(activity.userRole)}</p>
            </div>
            <div className="col-span-3">
              <p className="text-[10px] text-[#8a96ad]">Nom</p>
              <p className="mt-0.5 text-[12px] font-semibold text-[#071f3d]">{activity.userName || "—"}</p>
            </div>
          </div>
        </div>

        {/* EVENEMENT */}
        <div className="border-b border-[#f0f3f8] px-3.5 py-2.5">
          <p className="mb-2 text-xs font-bold uppercase text-[#9d0208]">Evenement</p>
          <div className="grid grid-cols-3 gap-y-2">
            <div>
              <p className="text-[10px] text-[#8a96ad]">Ressource</p>
              <p className="mt-0.5 text-[12px] font-semibold text-[#071f3d]">{activity.entityType.toLowerCase()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-[#8a96ad]">Element</p>
              <p className="mt-0.5 break-words text-[12px] font-semibold text-[#071f3d]">{activity.entityLabel || "—"}</p>
            </div>
            <div className="col-span-3">
              <p className="text-[10px] text-[#8a96ad]">Type d'action</p>
              <p className="mt-1">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getActionClassName(activity.actionType)}`}>
                  {activity.actionType}
                </span>
              </p>
            </div>
            <div className="col-span-3">
              <p className="text-[10px] text-[#8a96ad]">Resume</p>
              <p className="mt-0.5 break-words text-[12px] leading-relaxed text-[#4f5b76]">{activity.summary || "—"}</p>
            </div>
          </div>
        </div>

        {/* EXPORT */}
        <div className="px-3.5 py-2.5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase text-[#9d0208]">Payload JSON</p>
            <AuditExportMenu activities={[activity]} prefix={`audit-activite-${activity.entityLabel}`} />
          </div>
          <div className="overflow-hidden rounded-lg bg-[#10131c]">
            <pre className="max-h-[220px] overflow-auto p-3 text-[11px] leading-5 text-[#a9f0cc]">
              <code>{payloadJson}</code>
            </pre>
          </div>
        </div>

      </div>
    </aside>
  );
}
