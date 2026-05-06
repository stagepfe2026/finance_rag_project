import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";

import type { AuditTrendPoint } from "../../../models/audit";
import { useAdminDarkMode } from "../../hooks/useAdminDarkMode";
import { DARK, LIGHT, buildChartTheme, buildFill, buildStroke } from "../../utils/chartTheme";

export default function AuditChart({ trend }: { trend: AuditTrendPoint[] }) {
  const isDark = useAdminDarkMode();

  const categories = useMemo(() => trend.map((p) => p.label), [trend]);
  const maxCount = useMemo(() => Math.max(...trend.map((p) => p.count), 1), [trend]);

  const seriesColors = isDark
    ? [DARK.navy, DARK.red, DARK.black, DARK.gray]
    : [LIGHT.navy, LIGHT.red, LIGHT.black, LIGHT.gray];

  const series = useMemo(
    () => [
      { name: "Authentification", data: trend.map((p) => p.authentification) },
      { name: "Reclamations", data: trend.map((p) => p.reclamations) },
      { name: "Chat", data: trend.map((p) => p.chat) },
      { name: "Recherche document", data: trend.map((p) => p.documentSearch) },
    ],
    [trend],
  );

  const options = useMemo<ApexOptions>(() => {
    const theme = buildChartTheme(isDark);

    return {
      chart: {
        ...theme.chart,
        type: "area",
        height: 260,
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, speed: 400 },
      },
      colors: seriesColors,
      dataLabels: { enabled: false },
      stroke: buildStroke(isDark, 1.5),
      fill: buildFill(isDark),
      markers: {
        ...theme.markers,
        strokeColors: seriesColors,
      },
      grid: theme.grid,
      legend: theme.legend,
      xaxis: { ...theme.xaxis, categories },
      yaxis: {
        ...theme.yaxis,
        max: Math.max(maxCount, 4),
        labels: {
          ...theme.yaxis!.labels,
          formatter: (value: number) => String(Math.round(value)),
        },
      },
      tooltip: {
        ...theme.tooltip,
        y: { formatter: (value: number) => `${value} activité${value !== 1 ? "s" : ""}` },
      },
      responsive: [
        { breakpoint: 640, options: { chart: { height: 220 }, stroke: { width: 1.2 }, markers: { size: 2 } } },
      ],
    };
  }, [isDark, categories, maxCount, seriesColors]);

  return (
    <section className="rounded border border-[#e5eaf2] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5eaf2] px-4 py-3">
        <h2 className="mt-0.5 text-xs font-bold text-[#071f3d]">Évolution des activités audit</h2>
      </div>

      <div className="px-2 pb-2 pt-3">
        {trend.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center rounded border border-dashed border-[#e5eaf2] text-[12px] text-[#8a96ad]">
            Aucune donnée disponible.
          </div>
        ) : (
          <Chart options={options} series={series} type="area" height={314} width="100%" />
        )}
      </div>
    </section>
  );
}
