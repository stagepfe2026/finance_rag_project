import { CalendarDays } from "lucide-react";

import type { AdminDashboardTrendPoint } from "../../../models/admin-dashboard";

type DashboardHeaderProps = {
  urgentCasesCount: number;
  pendingReclamationsCount: number;
  trend: AdminDashboardTrendPoint[];
};

function parseDate(value: string) {
  const parsedDate = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export default function DashboardHeader({ urgentCasesCount, pendingReclamationsCount, trend }: DashboardHeaderProps) {
  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const today = new Date();
  const firstTrendDate = trend[0]?.date ? parseDate(trend[0].date) : null;
  const periodLabel = firstTrendDate
    ? `${dateFormatter.format(firstTrendDate)} - ${dateFormatter.format(today)}`
    : dateFormatter.format(today);

  return (
    <header className="bg-[#f7f9fc] px-5 py-4 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#071f3d]">
            Vue globale <span className="text-[#9d0208]">administration</span>
          </h1>
          <p className="mt-2 max-w-3xl text-[13px] text-[#5f6680]">
            Suivez les documents indexes, les reclamations, les cas urgents et les derniers acces utilisateurs dans une vue unique.
          </p>
        </div>
        <div className="text-right">
          <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e0e6f0] bg-white px-4 text-[12px] font-bold text-[#071f3d] shadow-sm">
            <CalendarDays size={15} className="text-[#5f6680]" />
            <span>{periodLabel}</span>
          </div>
          <p className="mt-2 text-[11px] text-[#5f6680]">
            {urgentCasesCount} urgents - {pendingReclamationsCount} en attente
          </p>
        </div>
      </div>
    </header>
  );
}
