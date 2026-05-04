import type { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";

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

const CHART_COLORS = ["#b82f29", "#111111", "#6b7280", "#d1d5db"];

function buildOptions(kind: StatsChartKind, labels: string[], title?: string): ApexOptions {
  return {
    chart: {
      background: "#ffffff",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: CHART_COLORS,
    dataLabels: {
      enabled: kind === "pie",
      style: {
        colors: ["#ffffff"],
        fontSize: "10px",
        fontWeight: 600,
      },
    },
    grid: {
      borderColor: "#d1d5db",
      strokeDashArray: 3,
    },
    labels,
    legend: {
      show: true,
      position: "bottom",
      fontSize: "11px",
      labels: {
        colors: "#111111",
      },
      markers: {
        fillColors: CHART_COLORS,
      },
    },
    stroke: {
      curve: "straight",
      width: 2,
      colors: ["#b82f29"],
    },
    theme: {
      mode: "light",
      monochrome: {
        enabled: false,
      },
    },
    title: title
      ? {
          text: title,
          align: "left",
          style: {
            color: "#111111",
            fontSize: "12px",
            fontWeight: 700,
          },
        }
      : undefined,
    tooltip: {
      theme: "light",
    },
    xaxis:
      kind === "pie"
        ? undefined
        : {
            categories: labels,
            axisBorder: { color: "#6b7280" },
            axisTicks: { color: "#6b7280" },
            labels: {
              rotate: -35,
              trim: true,
              style: {
                colors: "#111111",
                fontSize: "10px",
              },
            },
          },
    yaxis:
      kind === "pie"
        ? undefined
        : {
            labels: {
              style: {
                colors: "#111111",
                fontSize: "10px",
              },
            },
          },
  };
}

export default function StatsChart({ data, title = "Visualisation statistique", kind = "bar" }: StatsChartProps) {
  const cleanData = data.filter((point) => Number.isFinite(point.value));

  if (cleanData.length === 0) {
    return null;
  }

  const labels = cleanData.map((point) => point.label);
  const values = cleanData.map((point) => point.value);
  const options = buildOptions(kind, labels, title);

  return (
    <div className="rounded-md border border-[#d1d5db] bg-white px-3 py-3">
      <ReactApexChart
        options={options}
        series={kind === "pie" ? values : [{ name: title, data: values }]}
        type={kind}
        height={260}
      />
    </div>
  );
}
