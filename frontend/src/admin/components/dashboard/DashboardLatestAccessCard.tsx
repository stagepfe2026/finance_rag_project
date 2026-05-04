import type { AdminDashboardLatestAccess } from "../../../models/admin-dashboard";
import { formatRelative } from "./dashboardFormatters";

export default function DashboardLatestAccessCard({ items }: { items: AdminDashboardLatestAccess[] }) {
  const visible = items.slice(0, 5);
  return (
    <div className="rounded border border-[#e5eaf2]  rounded-lg bg-white">
      {/* Header */}
      <div className="border-b border-[#e5eaf2] px-4 py-1">
        <h2 className="mt-0.5 text-sm font-bold text-[#071f3d]">5 derniers accès</h2>
      </div>

      {/* List */}
      <div className="divide-y divide-[#e5eaf2] ">
        {visible.length === 0 ? (
          <p className="px-4 py-5 text-[12px] text-[#8a96ad]">Aucun accès récent.</p>
        ) : (
          visible.map(access => (
            <div key={access.userId} className="flex items-center gap-3 px-4 py-2 hover:bg-[#f7f9fc] transition-colors">
              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-[#071f3d]">{access.userName}</p>
                <p className="truncate text-[11px] text-[#8a96ad]">{access.email}</p>
              </div>

              {/* Meta */}
              <div className="shrink-0 text-right">
                <span className="inline-block rounded border border-[#e5eaf2] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#5f6680]">
                  {access.authMethod}
                </span>
                <p className="mt-0.5 text-[10px] text-[#8a96ad]">{formatRelative(access.lastActivityAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}