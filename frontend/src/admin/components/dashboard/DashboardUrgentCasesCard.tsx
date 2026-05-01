import { Activity } from "lucide-react";

import type { AdminDashboardUrgentCase } from "../../../models/admin-dashboard";
import { formatRelative, getStatusLabel } from "./dashboardFormatters";

export default function DashboardUrgentCasesCard({ items }: { items: AdminDashboardUrgentCase[] }) {
  return (
    <div className="rounded-2xl border border-[#eadfdd] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#a5918e]">Urgences</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[#201d1d]">Cas prioritaires</h2>
        </div>
        <Activity size={17} className="text-[#9d0208]" />
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#eadfdd] bg-[#fbf8f7] px-4 py-5 text-sm text-[#7e7370]">
            Aucun cas urgent pour le moment.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-[#f4d7d5] bg-[#fff5f4] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#231f1f]">{item.ticketNumber}</p>
                  <p className="mt-1 truncate text-[12px] text-[#7e7370]">{item.subject}</p>
                </div>
                <span className="rounded-full border border-[#f0c4c4] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#9d0208]">
                  {getStatusLabel(item.status)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px] text-[#7e7370]">
                <span>{item.userEmail}</span>
                <span>{formatRelative(item.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
