import type { AdminDashboardTrendPoint } from "../../../models/admin-dashboard";

type TrendKey = "documents" | "reclamations";

export function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const diffHours = Math.max(1, Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60)));
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `Il y a ${diffDays} j`;
}

export function getCategoryLabel(value: string) {
  const labels: Record<string, string> = {
    finance: "Loi Finance",
    legal: "Juridique",
    hr: "RH",
    compliance: "Conformite",
    other: "Autre",
  };
  return labels[value] ?? value;
}

export function getStatusLabel(value: string) {
  const labels: Record<string, string> = {
    indexed: "Indexe",
    processing: "En cours",
    failed: "Echoue",
    PENDING: "En attente",
    IN_PROGRESS: "En cours",
    RESOLVED: "Traitee",
  };
  return labels[value] ?? value;
}

export function buildTrendCoordinates(points: AdminDashboardTrendPoint[], key: TrendKey) {
  if (points.length === 0) return [];
  const maxValue = Math.max(...points.map((point) => point[key]), 1);
  const horizontalPadding = 3;
  const topPadding = 8;
  const bottomPadding = 92;
  const chartHeight = bottomPadding - topPadding;

  return points.map((point, index) => ({
    x: horizontalPadding + (index / Math.max(points.length - 1, 1)) * (100 - horizontalPadding * 2),
    y: bottomPadding - (point[key] / maxValue) * chartHeight,
    value: point[key],
    label: point.label,
  }));
}

export function buildTrendPath(points: AdminDashboardTrendPoint[], key: TrendKey) {
  const coordinates = buildTrendCoordinates(points, key);
  if (coordinates.length === 0) return "";
  if (coordinates.length === 1) {
    return `M 3 ${coordinates[0].y} L 97 ${coordinates[0].y}`;
  }

  return coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

export function buildTrendAreaPath(points: AdminDashboardTrendPoint[], key: TrendKey) {
  const coordinates = buildTrendCoordinates(points, key);
  if (coordinates.length === 0) return "";
  if (coordinates.length === 1) {
    return `M 3 ${coordinates[0].y} L 97 ${coordinates[0].y} L 97 92 L 3 92 Z`;
  }

  const line = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  return `${line} L 97 92 L 3 92 Z`;
}
