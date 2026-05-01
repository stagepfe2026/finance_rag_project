import { FileText, MessageSquareWarning, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import type { AdminDashboardTrendPoint } from "../../../models/admin-dashboard";
import { buildTrendAreaPath, buildTrendCoordinates, buildTrendPath } from "./dashboardFormatters";

type DashboardTrendCardProps = {
  trend: AdminDashboardTrendPoint[];
  isLoading: boolean;
};

type TrendMode = "reclamations" | "documents";

const trendOptions: Record<
  TrendMode,
  {
    label: string;
    shortLabel: string;
    icon: LucideIcon;
    color: string;
    softColor: string;
    buttonClassName: string;
  }
> = {
  reclamations: {
    label: "Reclamations",
    shortLabel: "Rec",
    icon: MessageSquareWarning,
    color: "#9d0208",
    softColor: "#fff0f2",
    buttonClassName: "bg-[#9d0208] text-white shadow-[0_10px_24px_rgba(157,2,8,0.18)]",
  },
  documents: {
    label: "Documents",
    shortLabel: "Doc",
    icon: FileText,
    color: "#071f3d",
    softColor: "#eef4ff",
    buttonClassName: "bg-[#071f3d] text-white shadow-[0_10px_24px_rgba(7,31,61,0.18)]",
  },
};

export default function DashboardTrendCard({ trend, isLoading }: DashboardTrendCardProps) {
  const [activeTrend, setActiveTrend] = useState<TrendMode>("reclamations");
  const activeOption = trendOptions[activeTrend];
  const ActiveIcon = activeOption.icon;
  const activePath = useMemo(() => buildTrendPath(trend, activeTrend), [activeTrend, trend]);
  const activeAreaPath = useMemo(() => buildTrendAreaPath(trend, activeTrend), [activeTrend, trend]);
  const activePoints = useMemo(() => buildTrendCoordinates(trend, activeTrend), [activeTrend, trend]);
  const total = useMemo(() => trend.reduce((sum, point) => sum + point[activeTrend], 0), [activeTrend, trend]);
  const peak = useMemo(() => Math.max(...trend.map((point) => point[activeTrend]), 0), [activeTrend, trend]);
  const gradientId = `adminTrendFill-${activeTrend}`;

  return (
    <div className="overflow-hidden rounded-lg border border-[#e0e6f0] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#6c7894]">Activite</p>
          <h2 className="mt-1 text-[20px] font-bold text-[#071f3d]">Documents et reclamations</h2>
          <p className="mt-1 text-[12px] text-[#5f6680]">
            Courbe dynamique pour suivre {activeOption.label.toLowerCase()}.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#e0e6f0] bg-[#f7f9fd] p-1 text-[11px]">
          {(Object.keys(trendOptions) as TrendMode[]).map((mode) => {
            const option = trendOptions[mode];
            const Icon = option.icon;
            const isActive = activeTrend === mode;

            return (
              <button
                key={mode}
                type="button"
                onClick={() => setActiveTrend(mode)}
                className={[
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 font-bold transition",
                  isActive
                    ? option.buttonClassName
                    : "bg-white text-[#071f3d] hover:bg-[#eef4ff] hover:text-[#9d0208]",
                ].join(" ")}
              >
                <Icon size={13} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-[#e0e6f0] bg-[#f7f9fd] px-3 py-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: activeOption.softColor, color: activeOption.color }}
        >
          <ActiveIcon size={16} />
        </span>
        <div className="min-w-[150px]">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#6c7894]">Courbe active</p>
          <p className="text-sm font-bold text-[#071f3d]">{activeOption.label}</p>
        </div>
        <div className="ml-auto grid grid-cols-2 gap-2 text-right max-sm:ml-0 max-sm:w-full">
          <div className="rounded-lg bg-white px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#6c7894]">Total periode</p>
            <p className="text-lg font-bold leading-none text-[#071f3d]">{total}</p>
          </div>
          <div className="rounded-lg bg-white px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#6c7894]">Pic journalier</p>
            <p className="text-lg font-bold leading-none text-[#071f3d]">{peak}</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-[260px] rounded-lg border border-[#eef1f7] bg-white px-3 py-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-[#5f6680]">Chargement...</div>
          ) : trend.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[#dce4f0] bg-[#f7f9fd] text-sm text-[#5f6680]">
              Aucune donnee disponible.
            </div>
          ) : (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
              <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={activeOption.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={activeOption.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 25, 50, 75, 100].map((line) => (
                <line
                  key={line}
                  x1="0"
                  y1={line}
                  x2="100"
                  y2={line}
                  stroke="#dfe5ee"
                  strokeDasharray="2 3"
                  strokeWidth="0.5"
                />
              ))}
              <g key={activeTrend}>
                <path d={activeAreaPath} fill={`url(#${gradientId})`} className="admin-trend-area" />
                <path
                  d={activePath}
                  fill="none"
                  stroke={activeOption.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.8"
                  vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  className="admin-trend-line"
                />
                {activePoints.map((point) => (
                  <circle
                    key={`${point.label}-${point.x}`}
                    cx={point.x}
                    cy={point.y}
                    r="1.25"
                    fill="#ffffff"
                    stroke={activeOption.color}
                    strokeWidth="1.2"
                    vectorEffect="non-scaling-stroke"
                    className="admin-trend-dot"
                  />
                ))}
              </g>
            </svg>
          )}
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        {isLoading ? (
          <div className="h-14 rounded-lg bg-[#f7f9fd]" />
        ) : (
          <div
            className="grid min-w-[520px] gap-2 text-center text-[11px] text-[#5f6680]"
            style={{ gridTemplateColumns: `repeat(${Math.max(trend.length, 1)}, minmax(70px, 1fr))` }}
          >
            {trend.map((point) => (
              <div key={point.date} className="rounded-lg border border-[#eef1f7] bg-[#f7f9fd] px-2 py-2">
                <p className="font-bold text-[#071f3d]">{point.label}</p>
                <p className="mt-1 font-semibold" style={{ color: activeOption.color }}>
                  {activeOption.shortLabel} {point[activeTrend]}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
