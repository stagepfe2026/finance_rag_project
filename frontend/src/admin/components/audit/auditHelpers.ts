import type { AuditActivity, AuditTrendPoint } from "../../../models/audit";

export function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function getRoleLabel(role: string) {
  return role === "ADMIN" ? "Admin" : role === "FINANCE_USER" ? "Utilisateur" : role || "-";
}

export function getCategoryClassName(category: string) {
  return category === "Authentification"
    ? "border-[#d9def0] bg-[#f8faff] text-[#273043]"
    : "border-[#f2d6d4] bg-[#fff4f3] text-[#9d0208]";
}

export function getActionClassName(actionType: string) {
  if (actionType.includes("LOGIN")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (actionType.includes("LOGOUT") || actionType.includes("SESSION")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (actionType.includes("DELETED")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-[#f0d9d7] bg-[#fff6f5] text-[#9d0208]";
}

export function buildSmoothLinePath(points: AuditTrendPoint[]) {
  if (points.length === 0) {
    return "";
  }

  const maxCount = Math.max(...points.map((point) => point.count), 1);
  const coordinates = points.map((point, index) => ({
    x: (index / Math.max(points.length - 1, 1)) * 100,
    y: 100 - (point.count / maxCount) * 82 - 8,
  }));

  if (coordinates.length === 1) {
    return `M ${coordinates[0].x} ${coordinates[0].y}`;
  }

  let path = `M ${coordinates[0].x} ${coordinates[0].y}`;
  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const current = coordinates[index];
    const next = coordinates[index + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

export function buildActivityPayload(activity: AuditActivity) {
  return JSON.stringify(
    {
      action: activity.actionType,
      status: activity.actionLabel,
      level: activity.category === "Authentification" ? "INFO" : "BUSINESS",
      details: {
        message: activity.summary,
        entityType: activity.entityType,
        entityLabel: activity.entityLabel,
      },
      user: {
        id: activity.userId,
        name: activity.userName,
        email: activity.userEmail,
        role: activity.userRole,
      },
      metadata: activity.metadata,
      occurredAt: activity.occurredAt,
    },
    null,
    2,
  );
}
