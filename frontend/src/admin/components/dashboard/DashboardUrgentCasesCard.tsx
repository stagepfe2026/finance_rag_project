import type { AdminDashboardUrgentCase } from "../../../models/admin-dashboard";
import { formatRelative, getStatusLabel } from "./dashboardFormatters";

const STATUS_STYLE: Record<string, string> = {
  PENDING:     "bg-amber-50 border-amber-200 text-amber-700",
  IN_PROGRESS: "bg-[#eef2f8] border-[#e5eaf2] text-[#071f3d]",
  RESOLVED:    "bg-emerald-50 border-emerald-200 text-emerald-700",
};

export default function DashboardUrgentCasesCard({ items }: { items: AdminDashboardUrgentCase[] }) {
  return (
    <div className="rounded border border-[#e5eaf2] rounded-lg  bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5eaf2] px-4 py-3">
        <div>
          <h2 className="mt-0.5 text-sm font-bold text-[#071f3d]">Cas prioritaires</h2>
        </div>
        {items.length > 0 && (
          <span className="rounded bg-[#f5e6e7] px-2 py-0.5 text-[10px] font-bold text-[#9d0208]">
            {items.length}
          </span>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-[#e5eaf2]">
        {items.length === 0 ? (
          <p className="px-4 py-3 text-xs text-[#8a96ad]">Aucun cas urgent pour le moment.</p>
        ) : (
          items.map(item => {
            const statusCls = STATUS_STYLE[item.status] ?? "bg-[#eef2f8] border-[#e5eaf2] text-[#071f3d]";
            return (
              <div key={item.id} className="px-4 py-3 hover:bg-[#f7f9fc] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#071f3d] font-mono">{item.ticketNumber}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[#5f6680]">{item.subject}</p>
                  </div>
                  <span className={`shrink-0 rounded border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${statusCls}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#8a96ad]">
                  <span>{item.userEmail}</span>
                  <span>{formatRelative(item.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}