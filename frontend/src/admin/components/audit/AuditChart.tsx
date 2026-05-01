import { useMemo } from "react";

import type { AuditTrendPoint } from "../../../models/audit";
import { buildSmoothLinePath } from "./auditHelpers";

export default function AuditChart({ trend }: { trend: AuditTrendPoint[] }) {
  const linePath = useMemo(() => buildSmoothLinePath(trend), [trend]);
  const maxCount = useMemo(() => Math.max(...trend.map((point) => point.count), 1), [trend]);

  return (
    <div className="rounded-2xl border border-[#eadfdd] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#a08f8c]">Courbe</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[#211f1f]">Activite des 7 derniers jours</h2>
        </div>
        <span className="inline-flex h-8 items-center rounded-full border border-[#f0dfdd] bg-[#fff8f7] px-3 text-xs font-semibold text-[#9d0208]">
          Pic {maxCount}
        </span>
      </div>

      <div className="mt-5">
        {trend.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#eadfdd] bg-[#fbf8f7] px-4 py-10 text-center text-sm text-[#857977]">
            Aucune activite recente a afficher.
          </div>
        ) : (
          <div>
            <div className="h-[200px] rounded-2xl border border-[#f1e7e5] bg-[#fffdfc] px-4 py-5">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                {[20, 40, 60, 80].map((line) => (
                  <line key={line} x1="0" y1={line} x2="100" y2={line} stroke="#f0e7e5" strokeWidth="0.45" />
                ))}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#9d0208"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                {trend.map((point, index) => {
                  const x = (index / Math.max(trend.length - 1, 1)) * 100;
                  const y = 100 - (point.count / maxCount) * 82 - 8;
                  return (
                    <circle
                      key={point.date}
                      cx={x}
                      cy={y}
                      r="1.15"
                      fill="#9d0208"
                      stroke="#ffffff"
                      strokeWidth="0.9"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>
            </div>

            <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(52px,1fr))] gap-1.5 text-center text-[11px] text-[#7e7371]">
              {trend.map((point) => (
                <div key={point.date} className="rounded-lg px-1.5 py-1.5 transition hover:bg-[#fbf6f5]">
                  <p className="truncate font-medium text-[#605654]">{point.label}</p>
                  <p className="mt-0.5 text-[10px] text-[#9d0208]">{point.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
