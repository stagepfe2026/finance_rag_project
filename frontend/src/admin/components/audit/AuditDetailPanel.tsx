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
    <aside className="fixed inset-y-0 right-0 z-50 flex w-[min(100vw,480px)] flex-col border-l border-[#eadfdd] bg-white shadow-[-18px_0_50px_rgba(47,28,28,0.14)]">
      <div className="flex items-start justify-between gap-4 border-b border-[#efe4e1] px-5 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9d0208]">Inspection</p>
          <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[#1f1c1c]">Details du log</h2>
          <p className="mt-1 text-[13px] text-[#8a7d7a]">Consultation laterale sans quitter la liste.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e8dcda] bg-[#fbf8f7] text-[#7f7270] transition hover:border-[#9d0208] hover:text-[#9d0208]"
        >
          <X size={17} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#efe4e1] bg-[#fcf8f7] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6a5f5d]">{activity.actionType}</p>
                <p className="mt-2 text-base font-semibold text-[#201d1d]">{activity.actionLabel}</p>
                <p className="mt-1 text-sm text-[#807370]">
                  {activity.category} | {formatDateTime(activity.occurredAt)}
                </p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getActionClassName(activity.actionType)}`}>
                {activity.actionLabel}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#efe4e1] bg-white p-4">
            <h3 className="text-base font-semibold text-[#201d1d]">Utilisateur</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="text-[12px] text-[#958885]">Identifiant</span>
                <p className="mt-1 break-words font-medium text-[#201d1d]">{activity.userEmail || activity.userId || "-"}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#958885]">Nom</span>
                <p className="mt-1 font-medium text-[#201d1d]">{activity.userName || "-"}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#958885]">Role</span>
                <p className="mt-1 font-medium text-[#201d1d]">{getRoleLabel(activity.userRole)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#efe4e1] bg-white p-4">
            <h3 className="text-base font-semibold text-[#201d1d]">Evenement</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="text-[12px] text-[#958885]">Ressource</span>
                <p className="mt-1 font-medium text-[#201d1d]">{activity.entityType.toLowerCase()}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#958885]">Element</span>
                <p className="mt-1 break-words font-medium text-[#201d1d]">{activity.entityLabel}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#958885]">Date complete</span>
                <p className="mt-1 font-medium text-[#201d1d]">{formatDateTime(activity.occurredAt)}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#958885]">Resume</span>
                <p className="mt-1 break-words font-medium text-[#201d1d]">{activity.summary}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#958885]">Categorie</span>
                <p className="mt-2">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getCategoryClassName(activity.category)}`}>
                    {activity.category}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#efe4e1] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#201d1d]">Payload JSON</h3>
                <p className="mt-1 text-sm text-[#8a7d7a]">Exporter cette activite.</p>
              </div>
              <div className="flex items-center gap-2">
                <Download size={15} className="text-[#9d0208]" />
                <AuditExportMenu activities={[activity]} prefix={`audit-activite-${activity.entityLabel}`} />
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl bg-[#10131c]">
              <pre className="max-h-[280px] overflow-auto p-4 text-[12px] leading-6 text-[#a9f0cc]">
                <code>{payloadJson}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
