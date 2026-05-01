import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

import type { AdminDashboardTrendPoint } from "../../../models/admin-dashboard";

type DashboardHeaderProps = {
  urgentCasesCount: number;
  pendingReclamationsCount: number;
  trend: AdminDashboardTrendPoint[];
  statsStartDate: string;
  statsEndDate: string;
  onStatsStartDateChange: (value: string) => void;
  onUseLastMonth: () => void;
};

function parseDate(value: string) {
  const parsedDate = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export default function DashboardHeader({
  urgentCasesCount,
  pendingReclamationsCount,
  trend,
  statsStartDate,
  statsEndDate,
  onStatsStartDateChange,
  onUseLastMonth,
}: DashboardHeaderProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const endDate = parseDate(statsEndDate) ?? new Date();
  const firstTrendDate = trend[0]?.date ? parseDate(trend[0].date) : null;
  const startDate = parseDate(statsStartDate) ?? firstTrendDate;
  const periodLabel = startDate
    ? `${dateFormatter.format(startDate)} - ${dateFormatter.format(endDate)}`
    : dateFormatter.format(endDate);

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
        <div className="relative text-right">
          <button
            type="button"
            onClick={() => setIsDatePickerOpen((value) => !value)}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#e0e6f0] bg-white px-4 text-[12px] font-bold text-[#071f3d] shadow-sm transition hover:border-[#071f3d]"
            aria-expanded={isDatePickerOpen}
          >
              <CalendarDays size={15} className="text-[#5f6680]" />
              <span>{periodLabel}</span>
              <ChevronDown size={14} className={["text-[#5f6680] transition", isDatePickerOpen ? "rotate-180" : ""].join(" ")} />
          </button>
          {isDatePickerOpen ? (
            <div className="absolute right-0 top-[52px] z-30 w-[256px] rounded-lg border border-[#e0e6f0] bg-white px-4 py-3 text-left shadow-[0_20px_45px_rgba(7,31,61,0.12)]">
              <div className="mb-3 flex items-center gap-2 text-[12px] font-bold text-[#071f3d]">
                <CalendarDays size={15} className="text-[#5f6680]" />
                <span>{periodLabel}</span>
              </div>
              <div className="grid grid-cols-[58px_minmax(0,1fr)] items-center gap-3 text-[10px] uppercase tracking-[0.1em] text-[#6c7894]">
                <span>Debut</span>
                <input
                  type="date"
                  value={statsStartDate}
                  min={trend[0]?.date}
                  max={statsEndDate}
                  onChange={(event) => onStatsStartDateChange(event.target.value)}
                  className="h-10 rounded-md border border-[#d8def0] bg-[#f7f9fc] px-3 text-[12px] font-bold normal-case tracking-normal text-[#071f3d] outline-none"
                />
                <span>Fin</span>
                <span className="rounded-md bg-[#f7f9fc] px-3 py-3 text-[12px] font-bold normal-case tracking-normal text-[#071f3d]">
                  {dateFormatter.format(endDate)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onUseLastMonth();
                  setIsDatePickerOpen(false);
                }}
                className="mt-3 w-full rounded-md border border-[#d8def0] bg-[#eef4ff] px-3 py-3 text-[12px] font-bold text-[#071f3d] transition hover:border-[#071f3d]"
              >
                30 derniers jours
              </button>
            </div>
          ) : null}
          <p className="mt-2 text-[11px] text-[#5f6680]">
            {urgentCasesCount} urgents - {pendingReclamationsCount} en attente
          </p>
        </div>
      </div>
    </header>
  );
}
