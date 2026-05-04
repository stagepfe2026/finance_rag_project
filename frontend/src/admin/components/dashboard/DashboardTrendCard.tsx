import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import type { AdminDashboardTrendPoint } from "../../../models/admin-dashboard";

type Props = { trend: AdminDashboardTrendPoint[]; isLoading: boolean };

const NAV  = "#071f3d";
const RED  = "#9d0208";

function buildSeries(trend: AdminDashboardTrendPoint[]) {
  return [
    { name: "Documents",    data: trend.map(p => p.documents)    },
    { name: "Réclamations", data: trend.map(p => p.reclamations) },
  ];
}

export default function DashboardTrendCard({ trend, isLoading }: Props) {
  const categories = useMemo(() => trend.map(p => p.label), [trend]);
  const series     = useMemo(() => buildSeries(trend), [trend]);


  const options = useMemo<ApexOptions>(() => ({
    chart: {
      type: "area",
      height: 260,
      toolbar:   { show: false },
      zoom:      { enabled: false },
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      animations: { enabled: true, speed: 400 },
    },
    colors: [NAV, RED],
    dataLabels: { enabled: false },
    stroke:     { curve: "smooth", width: 1, lineCap: "round" },
    fill: {
      type: "gradient",
      gradient: { shade: "light", type: "vertical", opacityFrom: 0.25, opacityTo: 0.02, stops: [0, 100] },
    },
    markers: {
      size: 3,
      colors: ["#fff"],
      strokeColors: [NAV, RED],
      strokeWidth: 1,
      hover: { size: 4 },
    },
    grid: {
      borderColor: "#ebeff6",
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true  } },
      padding: { top: 0, right: 12, bottom: 0, left: 4 },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontSize: "11px",
      fontWeight: 600,
      labels: { colors: "black" },
      markers: { size: 4, shape: "circle", strokeWidth: 0 },
      itemMargin: { horizontal: 10 },
    },
    xaxis: {
      categories,
      axisBorder: { show: true, color: "#ea1c22" },
      axisTicks:  { show: false },
      tooltip:    { enabled: false },
      labels: {
        hideOverlappingLabels: true,
        trim: true,
        style: { colors: "#000000", fontSize: "10px", fontWeight: 600 },
      },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      tickAmount: 4,
      labels: {
        offsetX: -4,
        style: { colors: "#000000", fontSize: "10px", fontWeight: 600 },
      },
    },
    tooltip: { shared: true, intersect: false, marker: { show: true } },
    responsive: [
      { breakpoint: 640, options: { chart: { height: 210 }, stroke: { width: 1.5 }, markers: { size: 1 } } },
    ],
  }), [categories]);

  return (
    <div className="rounded border border-[#e5eaf2] rounded-lg  bg-white">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5eaf2] px-4 py-3">
        <div>
          <h2 className="mt-0.5 text-xs font-bold text-[#071f3d]">Documents &amp; Réclamations</h2>
        </div>

      </div>

      {/* Chart area */}
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