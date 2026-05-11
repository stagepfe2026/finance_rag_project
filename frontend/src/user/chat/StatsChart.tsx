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

const LIGHT_COLORS = ["#b82f29", "#111111", "#6b7280", "#d1d5db"];
const DARK_COLORS  = ["#e05a5f", "#e5e7eb", "#9ca3af", "#4b5563"];

function buildOptions(kind: StatsChartKind, labels: string[], isDark: boolean, title?: string): ApexOptions {
  const labelColor  = isDark ? "#94a3b8" : "#111111";
  const legendColor = isDark ? "#cbd5e1" : "#111111";
  const gridColor   = isDark ? "#1e2d42" : "#d1d5db";
  const bgColor     = isDark ? "#111827" : "#ffffff";
  const colors      = isDark ? DARK_COLORS : LIGHT_COLORS;

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
      enabled: kind === "pie",
      style: {
        colors: ["#ffffff"],
        fontSize: "10px",
        fontWeight: 600,
      },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 3,
    },
    labels,
    legend: {
      show: true,
      position: "bottom",
      fontSize: "11px",
      labels: { colors: legendColor },
      markers: { fillColors: colors },
    },
    stroke: {
      curve: "straight",
      width: 2,
      colors: [isDark ? "#e05a5f" : "#b82f29"],
    },
    theme: { mode: isDark ? "dark" : "light" },
    title: title
      ? {
          text: title,
          align: "left",
          style: {
            color: isDark ? "#e2e8f0" : "#111111",
            fontSize: "12px",
            fontWeight: 700,
          },
        }
      : undefined,
    tooltip: { theme: isDark ? "dark" : "light" },
    xaxis:
      kind === "pie"
        ? undefined
        : {
            categories: labels,
            axisBorder: { color: isDark ? "#374151" : "#6b7280" },
            axisTicks: { color: isDark ? "#374151" : "#6b7280" },
            labels: {
              rotate: -35,
              trim: true,
              style: { colors: labelColor, fontSize: "10px" },
            },
          },
    yaxis:
      kind === "pie"
        ? undefined
        : {
            min: 0,
            forceNiceScale: true,
            labels: {
              style: { colors: labelColor, fontSize: "10px" },
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
  const options = buildOptions(kind, labels, isDark, title);
  const chartKey = [
    kind,
    isDark ? "dark" : "light",
    title,
    labels.join("|"),
    values.join("|"),
  ].join("-");

  return (
    <div className="rounded-md border border-[#d1d5db] bg-white px-3 py-3">
      <ReactApexChart
        key={chartKey}
        options={options}
        series={kind === "pie" ? values : [{ name: title, data: values }]}
        type={kind}
        height={260}
      />
    </div>
  );
}
