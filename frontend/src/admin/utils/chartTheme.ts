import type { ApexOptions } from "apexcharts";

// ── Palette ─────────────────────────────────────────────────────────────────

export const LIGHT = {
  navy:  "#071f3d",
  red:   "#9d0208",
  rose:  "#f06f80",
  black: "#111827",
  gray:  "#8a96ad",
} as const;

export const DARK = {
  navy:  "#93c5fd",   // brighter blue, readable on dark bg
  red:   "#f87171",   // brighter red, WCAG-safe on dark
  rose:  "#fb7185",   // lighter rose
  black: "#e5e7eb",   // replaces near-black text with light slate
  gray:  "#9ca3af",   // mid-gray, visible on dark
} as const;

// ── Base chart options ───────────────────────────────────────────────────────

export function buildChartTheme(isDark: boolean): Pick<
  ApexOptions,
  "grid" | "legend" | "xaxis" | "yaxis" | "tooltip" | "markers" | "chart"
> {
  const labelColor  = isDark ? "#cbd5e1" : "#000000";
  const legendColor = isDark ? "#cbd5e1" : "#111827";
  const gridColor   = isDark ? "#1e2d42" : "#ebeff6";
  const strokeW     = isDark ? 1.5 : 1;
  const markerSize  = isDark ? 4 : 3;

  return {
    chart: {
      background: "transparent",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
    },
    grid: {
      borderColor: gridColor,
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
      labels: { colors: legendColor },
      markers: { size: markerSize, shape: "circle", strokeWidth: 0 },
      itemMargin: { horizontal: 10 },
    },
    xaxis: {
      axisBorder: { show: true, color: "#9d0208" },
      axisTicks: { show: false },
      tooltip: { enabled: false },
      labels: {
        hideOverlappingLabels: true,
        trim: true,
        style: { colors: labelColor, fontSize: "10px", fontWeight: 600 },
      },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      tickAmount: 4,
      labels: {
        offsetX: -4,
        style: { colors: labelColor, fontSize: "10px", fontWeight: 600 },
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      marker: { show: true },
      theme: isDark ? "dark" : "light",
    },
    markers: {
      size: markerSize,
      colors: isDark ? ["#1e293b"] : ["#ffffff"],
      strokeWidth: strokeW,
      hover: { size: markerSize + 1 },
    },
  };
}

// ── Fill helper ──────────────────────────────────────────────────────────────

export function buildFill(isDark: boolean): ApexOptions["fill"] {
  return {
    type: "gradient",
    gradient: {
      shade: isDark ? "dark" : "light",
      type: "vertical",
      opacityFrom: isDark ? 0.35 : 0.25,
      opacityTo: 0.02,
      stops: [0, 100],
    },
  };
}

// ── Stroke helper ────────────────────────────────────────────────────────────

export function buildStroke(isDark: boolean, width = 1): ApexOptions["stroke"] {
  return {
    curve: "smooth",
    width: isDark ? width + 0.5 : width,
    lineCap: "round",
  };
}
