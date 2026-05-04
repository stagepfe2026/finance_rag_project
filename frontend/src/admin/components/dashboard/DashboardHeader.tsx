import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const fmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function DashboardHeader({
  urgentCasesCount,
  pendingReclamationsCount,
  trend,
  statsStartDate,
  statsEndDate,
  onStatsStartDateChange,
  onUseLastMonth,
}: DashboardHeaderProps) {
  const [open, setOpen] = useState(false);

  const endDate   = parseDate(statsEndDate) ?? new Date();
  const startDate = parseDate(statsStartDate) ?? (trend[0]?.date ? parseDate(trend[0].date) : null);
  const period    = startDate
    ? `${fmt.format(startDate)} — ${fmt.format(endDate)}`
    : fmt.format(endDate);

  return (
    <header className=" px-3 py-1">
      <div className="flex flex-wrap items-center justify-between gap-4">

        {/* Left — identity */}
        <div>
          <h1 className="text-xl px-2 font-bold text-black capitalize  tracking-tight">
            Tableau de <span className="text-red-700">board</span>
          </h1>
        </div>

        {/* Right — period selector + counters */}
        <div className="flex flex-col items-end gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              className="inline-flex h-8 items-center gap-1.5 cursor-pointer  rounded border border-[#e5eaf2] bg-white px-3 text-[11px] font-semibold text-[#071f3d] hover:border-[#8a96ad] transition-colors"
              aria-expanded={open}
            >
              <span>{period}</span>
              <ChevronDown
                size={12}
                className={`text-[#8a96ad] transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <div className="absolute right-0 top-9 z-40 w-60 rounded border border-[#e5eaf2] bg-white shadow-lg p-3 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[#8a96ad]">
                  Période
                </p>

                <div className="grid grid-cols-[56px_1fr] items-center gap-2 text-[11px] text-[#5f6680]">
                  <span>Début</span>
                  <input
                    type="date"
                    value={statsStartDate}
                    min={trend[0]?.date}
                    max={statsEndDate}
                    onChange={e => onStatsStartDateChange(e.target.value)}
                    className="h-8 rounded border border-[#e5eaf2] bg-[#f7f9fc] px-2 text-[11px] font-semibold text-[#071f3d] outline-none focus:border-[#071f3d]"
                  />
                  <span>Fin</span>
                  <span className="px-2 py-1.5 text-[11px] font-semibold text-[#071f3d] bg-[#f7f9fc] rounded border border-[#e5eaf2]">
                    {fmt.format(endDate)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => { onUseLastMonth(); setOpen(false); }}
                  className="w-full rounded cursor-pointer border border-[#e5eaf2] bg-[#f7f9fc] py-1.5 text-[11px] font-semibold text-black hover:border-[#071f3d] hover:bg-[#DEE0E2] transition-colors"
                >
                  30 derniers jours
                </button>
              </div>
            )}
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-[#f5e6e7] px-2 py-0.5 text-[10px] font-semibold text-[#9d0208]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9d0208]" />
              {urgentCasesCount} urgent{urgentCasesCount !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-[#eef2f8] px-2 py-0.5 text-[10px] font-semibold text-[#071f3d]">
              {pendingReclamationsCount} en attente
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
