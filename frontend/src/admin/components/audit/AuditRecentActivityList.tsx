import type { AuditActivity } from "../../../models/audit";
import { formatDateTime, getActionClassName } from "./auditHelpers";

export default function AuditRecentActivityList({ items }: { items: AuditActivity[] }) {
  return (
    <div className="rounded-2xl border border-[#eadfdd] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#a08f8c]">Dernieres activites</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[#211f1f]">Flux recent</h2>
        </div>
        <span className="rounded-xl border border-[#f0dfdd] bg-[#fff7f6] px-3 py-2 text-[12px] font-semibold text-[#9d0208]">
          {items.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#eadfdd] bg-[#fbf8f7] px-4 py-6 text-sm text-[#857977]">
            Aucune activite recente.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#efe4e1] bg-[#fcf9f8] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#222020]">{item.summary}</p>
                  <p className="mt-1 text-[12px] text-[#827674]">
                    {item.userName || item.userEmail || "Utilisateur"} | {formatDateTime(item.occurredAt)}
                  </p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getActionClassName(item.actionType)}`}>
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
