import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";

import type { AuditTrendPoint } from "../../../models/audit";

const NAVY = "#133c6d";
const RED = "#9d0208";
const BLACK = "#111827";
const GRAY = "#8a96ad";

export default function AuditChart({ trend }: { trend: AuditTrendPoint[] }) {
  const categories = useMemo(() => trend.map((point) => point.label), [trend]);
  const maxCount = useMemo(() => Math.max(...trend.map((point) => point.count), 1), [trend]);
  const series = useMemo(
    () => [
      { name: "Authentification", data: trend.map((point) => point.authentification) },
      { name: "Reclamations", data: trend.map((point) => point.reclamations) },
      { name: "Chat", data: trend.map((point) => point.chat) },
      { name: "Recherche document", data: trend.map((point) => point.documentSearch) },
    ],
    [trend],
  );

  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: "area",
        height: 260,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        animations: { enabled: true, speed: 400 },
      },
      colors: [NAVY, RED, BLACK, GRAY],
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 1.5, lineCap: "round" },
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          opacityFrom: 0.18,
          opacityTo: 0.02,
          stops: [0, 100],
        },
      },
      markers: {
        size: 3,
        colors: ["#fff"],
        strokeColors: [NAVY, RED, BLACK, GRAY],
        strokeWidth: 1,
        hover: { size: 4 },
      },
      grid: {
        borderColor: "#ebeff6",
        strokeDashArray: 2,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
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
        axisTicks: { show: false },
        tooltip: { enabled: false },
        labels: {
          hideOverlappingLabels: true,
          trim: true,
          style: { colors: "#000000", fontSize: "10px", fontWeight: 600 },
        },
      },
      yaxis: {
        min: 0,
        max: Math.max(maxCount, 4),
        forceNiceScale: true,
        tickAmount: 4,
        labels: {
          offsetX: -4,
          formatter: (value) => String(Math.round(value)),
          style: { colors: "#000000", fontSize: "10px", fontWeight: 600 },
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        marker: { show: true },
        y: { formatter: (value) => `${value} activite${value !== 1 ? "s" : ""}` },
      },
      responsive: [
        { breakpoint: 640, options: { chart: { height: 220 }, stroke: { width: 1.2 }, markers: { size: 2 } } },
      ],
    }),
    [categories, maxCount],
  );

  return (
    <section className="rounded border border-[#e5eaf2] rounded-lg bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5eaf2] px-4 py-3">
        <h2 className="mt-0.5 text-xs font-bold text-[#071f3d]">Evolution des activites audit</h2>
      </div>

      <div className="px-2 pb-2 pt-3">
        {trend.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center rounded border border-dashed border-[#e5eaf2] text-[12px] text-[#8a96ad]">
            Aucune donnee disponible.
          </div>
        ) : (
          <Chart options={options} series={series} type="area" height={314} width="100%" />
        )}
      </div>
    </section>
  );
}
