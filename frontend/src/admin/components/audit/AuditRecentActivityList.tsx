import type { AuditActivity } from "../../../models/audit";
import { formatDateTime, getActionClassName } from "./auditHelpers";

export default function AuditRecentActivityList({ items }: { items: AuditActivity[] }) {
  return (
    <div className="rounded-lg border border-[#e5eaf2] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#e5eaf2] px-4 py-2">
        <h2 className="mt-0.5 text-sm font-bold text-[#071f3d]">Flux récent</h2>
        <span className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-2.5 py-1 text-[10px] font-semibold text-[#071f3d]">
          {items.length}
        </span>
      </div>

      <div className="space-y-3 p-4">
        {items.length === 0 ? (
          <div className="rounded border border-dashed border-[#e5eaf2] px-4 py-6 text-sm text-[#8a96ad]">
            Aucune activité récente.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#071f3d]">{item.summary}</p>
                  <p className="mt-1 text-[11px] text-[#8a96ad]">
                    {item.userName || item.userEmail || "Utilisateur"} | {formatDateTime(item.occurredAt)}
                  </p>
                </div>
                <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${getActionClassName(item.actionType)}`}>
                  {item.actionLabel}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
