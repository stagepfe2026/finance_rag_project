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

export function buildTrendCoordinates(points: AdminDashboardTrendPoint[], key: TrendKey, maxValueOverride?: number) {
  if (points.length === 0) return [];
  const maxValue = Math.max(maxValueOverride ?? Math.max(...points.map((point) => point[key]), 1), 1);
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

function buildSmoothPath(coordinates: ReturnType<typeof buildTrendCoordinates>) {
  if (coordinates.length === 0) return "";
  if (coordinates.length === 1) {
    return `M 3 ${coordinates[0].y} L 97 ${coordinates[0].y}`;
  }

  return coordinates.slice(0, -1).reduce((path, point, index) => {
    const previousPoint = coordinates[index - 1] ?? point;
    const nextPoint = coordinates[index + 1];
    const nextNextPoint = coordinates[index + 2] ?? nextPoint;
    const controlPoint1X = point.x + (nextPoint.x - previousPoint.x) / 6;
    const controlPoint1Y = point.y + (nextPoint.y - previousPoint.y) / 6;
    const controlPoint2X = nextPoint.x - (nextNextPoint.x - point.x) / 6;
    const controlPoint2Y = nextPoint.y - (nextNextPoint.y - point.y) / 6;

    return `${path} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${nextPoint.x} ${nextPoint.y}`;
  }, `M ${coordinates[0].x} ${coordinates[0].y}`);
}

export function buildTrendPath(points: AdminDashboardTrendPoint[], key: TrendKey, maxValueOverride?: number) {
  return buildSmoothPath(buildTrendCoordinates(points, key, maxValueOverride));
}

export function buildTrendAreaPath(points: AdminDashboardTrendPoint[], key: TrendKey, maxValueOverride?: number) {
  const coordinates = buildTrendCoordinates(points, key, maxValueOverride);
  if (coordinates.length === 0) return "";
  if (coordinates.length === 1) {
    return `M 3 ${coordinates[0].y} L 97 ${coordinates[0].y} L 97 92 L 3 92 Z`;
  }

  return `${buildSmoothPath(coordinates)} L ${coordinates[coordinates.length - 1].x} 92 L ${coordinates[0].x} 92 Z`;
}
