import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";

import type { AdminDashboardTrendPoint } from "../../../models/admin-dashboard";
import { useAdminDarkMode } from "../../hooks/useAdminDarkMode";
import { DARK, LIGHT, buildChartTheme, buildFill, buildStroke } from "../../utils/chartTheme";

type Props = { trend: AdminDashboardTrendPoint[]; isLoading: boolean };

export default function DashboardTrendCard({ trend, isLoading }: Props) {
  const isDark = useAdminDarkMode();

  const categories = useMemo(() => trend.map((p) => p.label), [trend]);

  const seriesColors = isDark
    ? [DARK.navy, DARK.red]
    : [LIGHT.navy, LIGHT.red];

  const series = useMemo(
    () => [
      { name: "Documents", data: trend.map((p) => p.documents) },
      { name: "Réclamations", data: trend.map((p) => p.reclamations) },
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
      stroke: buildStroke(isDark, 1),
      fill: buildFill(isDark),
      markers: {
        ...theme.markers,
        strokeColors: seriesColors,
      },
      grid: theme.grid,
      legend: theme.legend,
      xaxis: { ...theme.xaxis, categories },
      yaxis: theme.yaxis,
      tooltip: theme.tooltip,
      responsive: [
        { breakpoint: 640, options: { chart: { height: 210 }, stroke: { width: 1.5 }, markers: { size: 1 } } },
      ],
    };
  }, [isDark, categories, seriesColors]);

  return (
    <div className="rounded border border-[#e5eaf2] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5eaf2] px-4 py-3">
        <h2 className="mt-0.5 text-xs font-bold text-[#071f3d]">Documents &amp; Réclamations</h2>
      </div>

      <div className="px-2 pb-2 pt-3">
        {isLoading ? (
          <div className="flex h-[260px] items-center justify-center text-[12px] text-[#8a96ad]">
            Chargement…
          </div>
        ) : trend.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center rounded border border-dashed border-[#e5eaf2] text-[12px] text-[#8a96ad]">
            Aucune donnée disponible.
          </div>
        ) : (
          <Chart options={options} series={series} type="area" height={250} width="100%" />
        )}
      </div>
    </div>
  );
}
