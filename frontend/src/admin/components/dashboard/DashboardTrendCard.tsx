import { FileText, MessageSquareWarning } from "lucide-react";
import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";

import type { AdminDashboardTrendPoint } from "../../../models/admin-dashboard";

type DashboardTrendCardProps = {
  trend: AdminDashboardTrendPoint[];
  isLoading: boolean;
};

const documentsColor = "#071f3d";
const reclamationsColor = "#9d0208";

function buildSeries(trend: AdminDashboardTrendPoint[]) {
  return [
    {
      name: "Documents",
      data: trend.map((point) => point.documents),
    },
    {
      name: "Reclamations",
      data: trend.map((point) => point.reclamations),
    },
  ];
}

export default function DashboardTrendCard({ trend, isLoading }: DashboardTrendCardProps) {
  const categories = useMemo(() => trend.map((point) => point.label), [trend]);
  const series = useMemo(() => buildSeries(trend), [trend]);
  const totals = useMemo(
    () => ({
      documents: trend.reduce((sum, point) => sum + point.documents, 0),
      reclamations: trend.reduce((sum, point) => sum + point.reclamations, 0),
      documentsPeak: Math.max(...trend.map((point) => point.documents), 0),
      reclamationsPeak: Math.max(...trend.map((point) => point.reclamations), 0),
    }),
    [trend],
  );

  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        id: "admin-documents-reclamations-area",
        type: "area",
        height: 330,
        parentHeightOffset: 0,
        toolbar: { show: false },
        zoom: { enabled: false },
        redrawOnParentResize: true,
        redrawOnWindowResize: true,
        animations: {
          enabled: true,
          speed: 650,
          animateGradually: { enabled: true, delay: 90 },
          dynamicAnimation: { enabled: true, speed: 320 },
        },
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      },
      colors: [documentsColor, reclamationsColor],
      dataLabels: { enabled: false },
      stroke: {
        curve: "smooth",
        width: 3,
        lineCap: "round",
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.08,
          opacityFrom: 0.62,
          opacityTo: 0.08,
          stops: [0, 62, 100],
        },
      },
      markers: {
        size: 4,
        colors: ["#ffffff"],
        strokeColors: [documentsColor, reclamationsColor],
        strokeWidth: 2,
        hover: { size: 6 },
      },
      grid: {
        show: true,
        borderColor: "#e5ecf5",
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 4, right: 18, bottom: 0, left: 10 },
      },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "right",
        fontSize: "12px",
        fontWeight: 700,
        labels: { colors: "#071f3d" },
        markers: {
          size: 9,
          shape: "circle",
          strokeWidth: 0,
        },
        itemMargin: { horizontal: 12, vertical: 6 },
      },
      xaxis: {
        categories,
        axisBorder: { show: true, color: "#9aa6b8" },
        axisTicks: { show: false },
        tooltip: { enabled: false },
        labels: {
          rotate: 0,
          hideOverlappingLabels: true,
          trim: true,
          minHeight: 24,
          maxHeight: 34,
          style: {
            colors: "#6c7894",
            fontSize: "11px",
            fontWeight: 700,
          },
        },
      },
      yaxis: {
        min: 0,
        forceNiceScale: true,
        tickAmount: 4,
        labels: {
          offsetX: -4,
          style: {
            colors: "#8a96ad",
            fontSize: "11px",
            fontWeight: 700,
          },
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        marker: { show: true },
        x: { show: true },
      },
      responsive: [
        {
          breakpoint: 900,
          options: {
            chart: { height: 300 },
            legend: { horizontalAlign: "left" },
            grid: { padding: { right: 8, left: 2 } },
          },
        },
        {
          breakpoint: 560,
          options: {
            chart: { height: 270 },
            stroke: { width: 2.5 },
            markers: { size: 3 },
            xaxis: { labels: { style: { fontSize: "10px" } } },
          },
        },
      ],
    }),
    [categories],
  );

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-[#e0e6f0] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#6c7894]">Activite</p>
          <h2 className="mt-1 text-[20px] font-bold text-[#071f3d]">Documents et reclamations</h2>
          <p className="mt-1 text-[12px] text-[#5f6680]">
            Area chart responsive avec courbes lissees et gradients.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-right max-sm:w-full">
          <div className="rounded-lg border border-[#d8def0] bg-[#eef4ff] px-3 py-2">
            <div className="flex items-center justify-end gap-2 text-[10px] uppercase tracking-[0.1em] text-[#5f6680]">
              <FileText size={13} className="text-[#071f3d]" />
              Documents
            </div>
            <p className="mt-1 text-sm font-bold text-[#071f3d]">
              {totals.documents} total - pic {totals.documentsPeak}
            </p>
          </div>
          <div className="rounded-lg border border-[#ead5d8] bg-[#fff0f2] px-3 py-2">
            <div className="flex items-center justify-end gap-2 text-[10px] uppercase tracking-[0.1em] text-[#5f6680]">
              <MessageSquareWarning size={13} className="text-[#9d0208]" />
              Reclamations
            </div>
            <p className="mt-1 text-sm font-bold text-[#071f3d]">
              {totals.reclamations} total - pic {totals.reclamationsPeak}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 min-w-0 rounded-lg border border-[#e0e6f0] bg-[#fcfdff] px-2 pb-2 pt-3">
        {isLoading ? (
          <div className="flex h-[330px] items-center justify-center text-sm text-[#5f6680]">Chargement...</div>
        ) : trend.length === 0 ? (
          <div className="flex h-[330px] items-center justify-center rounded-lg border border-dashed border-[#dce4f0] bg-[#f7f9fd] text-sm text-[#5f6680]">
            Aucune donnee disponible.
          </div>
        ) : (
          <Chart options={options} series={series} type="area" height={330} width="100%" />
        )}
      </div>
    </div>
  );
}
