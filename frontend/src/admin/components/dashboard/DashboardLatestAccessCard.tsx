import { Clock3 } from "lucide-react";

import type { AdminDashboardLatestAccess } from "../../../models/admin-dashboard";
import { formatRelative } from "./dashboardFormatters";

export default function DashboardLatestAccessCard({ items }: { items: AdminDashboardLatestAccess[] }) {
  return (
    <div className="rounded-lg border border-[#e0e6f0] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#6c7894]">Acces recents</p>
          <h2 className="mt-1 text-[19px] font-bold text-[#071f3d]">Dernier acces user</h2>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff0f2] text-[#9d0208]">
          <Clock3 size={17} />
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#e0e6f0] bg-[#f7f9fc] px-4 py-5 text-sm text-[#5f6680]">
            Aucun acces recent.
          </div>
        ) : (
          items.map((access) => (
            <div key={access.userId} className="rounded-lg border border-[#e8edf5] bg-white px-4 py-3 transition hover:border-[#f3c6cc] hover:bg-[#fffafd]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9d0208] text-[12px] font-bold text-white">
                    {access.userName.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#071f3d]">{access.userName}</p>
                    <p className="mt-1 truncate text-[12px] text-[#5f6680]">{access.email}</p>
                  </span>
                </div>
                <span className="rounded-full border border-[#e0e6f0] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#071f3d]">
                  {access.authMethod.toUpperCase()}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px] text-[#5f6680]">
                <span>{access.role === "ADMIN" ? "Admin" : "Utilisateur"}</span>
                <span>{formatRelative(access.lastActivityAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
