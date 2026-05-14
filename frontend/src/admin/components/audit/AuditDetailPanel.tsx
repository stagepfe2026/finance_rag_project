import { Download, X } from "lucide-react";

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
    <aside className="fixed inset-y-0 right-0 z-50 flex w-[min(100vw,420px)] flex-col border-l border-[#e5eaf2] bg-white shadow-[-14px_0_34px_rgba(7,31,61,0.12)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#e5eaf2] px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9d0208]">Inspection</p>
          <h2 className="mt-1 text-base font-bold tracking-tight text-[#071f3d]">Details du log</h2>
          <p className="mt-0.5 text-[11px] text-[#5f6680]">Consultation laterale sans quitter la liste.</p>
        </div>
        <button
          type="button"
          aria-label="Fermer le detail du log"
          onClick={onClose}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#e5eaf2] bg-white text-[#5f6680] transition hover:border-[#9d0208] hover:text-[#9d0208]"
        >
          <X size={15} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-3">
          <div className="rounded-lg border border-[#e5eaf2] bg-[#f7f9fc] p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5f6680]">{activity.actionType}</p>
                <p className="mt-1 text-sm font-semibold text-[#071f3d]">{activity.actionLabel}</p>
                <p className="mt-0.5 text-[11px] text-[#5f6680]">
                  {activity.category} | {formatDateTime(activity.occurredAt)}
                </p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getActionClassName(activity.actionType)}`}>
                {activity.actionLabel}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-[#e5eaf2] bg-white p-3">
            <h3 className="text-sm font-bold text-[#071f3d]">Utilisateur</h3>
            <div className="mt-3 space-y-2 text-[12px]">
              <div>
                <span className="text-[11px] text-[#8a96ad]">Identifiant</span>
                <p className="mt-0.5 break-words font-semibold text-[#071f3d]">{activity.userEmail || activity.userId || "-"}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#8a96ad]">Nom</span>
                <p className="mt-0.5 font-semibold text-[#071f3d]">{activity.userName || "-"}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#8a96ad]">Role</span>
                <p className="mt-0.5 font-semibold text-[#071f3d]">{getRoleLabel(activity.userRole)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#e5eaf2] bg-white p-3">
            <h3 className="text-sm font-bold text-[#071f3d]">Evenement</h3>
            <div className="mt-3 space-y-2 text-[12px]">
              <div>
                <span className="text-[11px] text-[#8a96ad]">Ressource</span>
                <p className="mt-0.5 font-semibold text-[#071f3d]">{activity.entityType.toLowerCase()}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#8a96ad]">Element</span>
                <p className="mt-0.5 break-words font-semibold text-[#071f3d]">{activity.entityLabel}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#8a96ad]">Date complete</span>
                <p className="mt-0.5 font-semibold text-[#071f3d]">{formatDateTime(activity.occurredAt)}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#8a96ad]">Resume</span>
                <p className="mt-0.5 break-words font-semibold text-[#071f3d]">{activity.summary}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#8a96ad]">Categorie</span>
                <p className="mt-1">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getCategoryClassName(activity.category)}`}>
                    {activity.category}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#e5eaf2] bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#071f3d]">Payload JSON</h3>
                <p className="mt-0.5 text-[11px] text-[#5f6680]">Exporter cette activite.</p>
              </div>
              <div className="flex items-center gap-2">
                <Download size={15} className="text-[#9d0208]" />
                <AuditExportMenu activities={[activity]} prefix={`audit-activite-${activity.entityLabel}`} />
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg bg-[#10131c]">
              <pre className="max-h-[220px] overflow-auto p-3 text-[11px] leading-5 text-[#a9f0cc]">
                <code>{payloadJson}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
