import type { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";

import { useUserDarkMode } from "../hooks/useUserDarkMode";

export type StatsChartKind = "bar" | "pie" | "line";

export type StatsChartPoint = {
  label: string;
  value: number;
};

type StatsChartProps = {
  data: StatsChartPoint[];
  title?: string;
  kind?: StatsChartKind;
};

const LIGHT_COLORS = ["#9d0208", "#273043", "#64748b", "#cbd5e1", "#e5e7eb"];
const DARK_COLORS = ["#ef6b72", "#e2e8f0", "#94a3b8", "#475569", "#334155"];

function buildOptions(kind: StatsChartKind, labels: string[], isDark: boolean): ApexOptions {
  const labelColor = isDark ? "#cbd5e1" : "#5f6680";
  const gridColor = isDark ? "#26364d" : "#e5eaf2";
  const bgColor = "transparent";
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return {
    chart: {
      id: `chat-stats-${kind}-${isDark ? "dark" : "light"}`,
      background: bgColor,
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      toolbar: { show: false },
      zoom: { enabled: false },
      redrawOnParentResize: true,
      redrawOnWindowResize: true,
    },
    colors,
    dataLabels: {
      enabled: false,
      style: {
        colors: ["#ffffff"],
        fontSize: "10px",
        fontWeight: 500,
      },
    },
    grid: {
      show: kind !== "pie",
      borderColor: gridColor,
      strokeDashArray: 2,
      padding: { top: 0, right: 8, bottom: 0, left: 6 },
    },
    labels,
    legend: {
      show: kind === "pie",
      position: "bottom",
      fontSize: "10px",
      fontWeight: 500,
      labels: { colors: labelColor },
      markers: { fillColors: colors },
      itemMargin: { horizontal: 8, vertical: 2 },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "28%",
        dataLabels: { position: "top" },
      },
      pie: {
        expandOnClick: false,
        donut: { size: "58%" },
      },
    },
    stroke: {
      curve: "smooth",
      width: 2,
      colors: kind === "pie" ? colors : [isDark ? "#ef6b72" : "#9d0208"],
    },
    theme: { mode: isDark ? "dark" : "light" },
    tooltip: {
      theme: isDark ? "dark" : "light",
      style: { fontSize: "11px" },
    },
    xaxis:
      kind === "pie"
        ? undefined
        : {
            categories: labels,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
              rotate: 0,
              trim: true,
              style: { colors: labelColor, fontSize: "10px", fontWeight: 500 },
            },
          },
    yaxis:
      kind === "pie"
        ? undefined
        : {
            min: 0,
            forceNiceScale: true,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
              style: { colors: labelColor, fontSize: "10px", fontWeight: 500 },
            },
          },
  };
}

export default function StatsChart({ data, title = "Visualisation statistique", kind = "bar" }: StatsChartProps) {
  const isDark = useUserDarkMode();
  const cleanData = data.filter((point) => Number.isFinite(point.value));

  if (cleanData.length === 0) {
    return null;
  }

  const labels = cleanData.map((point) => point.label);
  const values = cleanData.map((point) => point.value);
  const options = buildOptions(kind, labels, isDark);
  const chartHeight = kind === "pie" ? 160 : 145;
  const chartKey = [
    kind,
    isDark ? "dark" : "light",
    title,
    labels.join("|"),
    values.join("|"),
  ].join("-");

  return (
    <div
      className={[
        "w-full max-w-[720px] rounded-lg border px-3 py-2",
        isDark ? "border-[#26364d] bg-[#111827]" : "border-[#e5eaf2] bg-white",
      ].join(" ")}
    >
      <div className="mb-0.5 flex items-center justify-between gap-3">
        <p className={["truncate text-[11px] font-semibold", isDark ? "text-slate-200" : "text-[#273043]"].join(" ")}>
          {title}
        </p>
        <span className={["text-[10px] font-medium", isDark ? "text-slate-400" : "text-[#8a96ad]"].join(" ")}>
          {cleanData.length} valeurs
        </span>
      </div>
      <ReactApexChart
        key={chartKey}
        options={options}
        series={kind === "pie" ? values : [{ name: title, data: values }]}
        type={kind}
        height={chartHeight}
      />
    </div>
  );
}
