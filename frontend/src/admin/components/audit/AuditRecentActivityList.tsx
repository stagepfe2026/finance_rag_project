import type { AuditActivity } from "../../../models/audit";

type ControlItem = {
  id: SensitiveAuditGroupId;
  label: string;
  value: number;
  tone: string;
  hint: string;
  types: string[];
};

export type SensitiveAuditGroupId =
  | "failed_logins"
  | "sla_overdue"
  | "indexation_failed"
  | "index_removed"
  | "reclamations_handled";

export const SENSITIVE_AUDIT_GROUPS: Array<{
  id: SensitiveAuditGroupId;
  label: string;
  hint: string;
  tone: string;
  types: string[];
  matches: (item: AuditActivity) => boolean;
}> = [
  {
    id: "failed_logins",
    label: "Connexions refusees",
    hint: "Tentatives a verifier",
    tone: "audit-control-neutral",
    types: ["USER_LOGIN_FAILED"],
    matches: (item) => item.actionType === "USER_LOGIN_FAILED",
  },
  {
    id: "sla_overdue",
    label: "Reclamations en retard",
    hint: "Delai de traitement depasse",
    tone: "audit-control-danger",
    types: ["SLA_OVERDUE_NOTIFICATION_SENT"],
    matches: (item) => item.actionType === "SLA_OVERDUE_NOTIFICATION_SENT",
  },
  {
    id: "indexation_failed",
    label: "Documents non traites",
    hint: "Traitement a relancer",
    tone: "audit-control-danger",
    types: ["DOCUMENT_INDEXATION_FAILED", "INDEXATION_FAILED_NOTIFICATION_SENT"],
    matches: (item) =>
      item.actionType === "DOCUMENT_INDEXATION_FAILED" ||
      item.actionType === "INDEXATION_FAILED_NOTIFICATION_SENT",
  },
  {
    id: "index_removed",
    label: "Suppressions",
    hint: "Documents retires de l usage",
    tone: "audit-control-neutral",
    types: ["DOCUMENT_REMOVED_FROM_INDEX", "DOCUMENT_DELETED_LOGICALLY"],
    matches: (item) =>
      item.actionType === "DOCUMENT_REMOVED_FROM_INDEX" ||
      item.actionType === "DOCUMENT_DELETED_LOGICALLY",
  },
  {
    id: "reclamations_handled",
    label: "Reclamations traitees",
    hint: "Demandes prises en charge",
    tone: "audit-control-neutral",
    types: ["RECLAMATION_TAKEN", "RECLAMATION_RESOLVED", "RECLAMATION_UPDATED"],
    matches: (item) =>
      item.actionType === "RECLAMATION_TAKEN" ||
      item.actionType === "RECLAMATION_RESOLVED" ||
      item.actionType === "RECLAMATION_UPDATED",
  },
];

function buildControlItems(items: AuditActivity[]): ControlItem[] {
  return SENSITIVE_AUDIT_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    hint: group.hint,
    tone: group.tone,
    types: group.types,
    value: items.filter(group.matches).length,
  }));
}

export default function AuditRecentActivityList({
  items,
  activeGroupId,
  onSelectGroup,
}: {
  items: AuditActivity[];
  activeGroupId: SensitiveAuditGroupId | null;
  onSelectGroup: (groupId: SensitiveAuditGroupId | null) => void;
}) {
  const controlItems = buildControlItems(items);
  const totalSensitive = controlItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-lg border border-[#e5eaf2] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#e5eaf2] px-4 py-2">
        <div>
          <h2 className="mt-0.5 text-[13px] font-bold text-[#071f3d]">Contrôle interne</h2>
          <p className="mt-0.5 text-[10px] text-[#8a96ad]">Cliquez pour filtrer la table</p>
        </div>
        {activeGroupId ? (
          <button
            type="button"
            onClick={() => onSelectGroup(null)}
            className="cursor-pointer rounded border border-[#e5eaf2] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#071f3d] transition hover:border-[#9d0208] hover:text-[#9d0208]"
          >
            Effacer
          </button>
        ) : (
          <span className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-2.5 py-1 text-[10px] font-semibold text-[#071f3d]">
            {totalSensitive}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-1">
        {controlItems.map((item) => {
          const isActive = activeGroupId === item.id;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectGroup(isActive ? null : item.id)}
              className={[
                "audit-control-card cursor-pointer rounded border px-3 py-2 text-left transition hover:-translate-y-px hover:shadow-sm",
                item.tone,
                isActive ? "ring-2 ring-[#071f3d]/15" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.03em]">{item.label}</p>
                  <p className="mt-0.5 truncate text-[9px] opacity-75">{item.hint}</p>
                </div>
                <p className="text-base font-bold leading-none">{item.value}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
