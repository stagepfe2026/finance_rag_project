import type { Reclamation, ReclamationSlaStatus } from "../../../models/reclamation";

export function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getStatusLabel(status: Reclamation["status"]) {
  switch (status) {
    case "PENDING":
      return "En attente";
    case "IN_PROGRESS":
      return "En cours";
    case "RESOLVED":
      return "Traitee";
    case "FAILED":
      return "A revoir";
    default:
      return status;
  }
}

export function getPriorityLabel(priority: Reclamation["priority"]) {
  switch (priority) {
    case "LOW":
      return "Basse";
    case "NORMAL":
      return "Normale";
    case "HIGH":
      return "Haute";
    case "URGENT":
      return "Urgente";
    default:
      return priority;
  }
}

export function getStatusClassName(status: Reclamation["status"]) {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "IN_PROGRESS":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "RESOLVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-rose-200 bg-rose-50 text-rose-700";
  }
}

export function getSlaStatusLabel(status: ReclamationSlaStatus): string {
  switch (status) {
    case "ON_TIME":
      return "Dans les delais";
    case "DUE_SOON":
      return "Bientot en retard";
    case "OVERDUE":
      return "En retard SLA";
    case "COMPLETED_ON_TIME":
      return "Traitee a temps";
    case "COMPLETED_LATE":
      return "Traitee en retard";
    default:
      return status;
  }
}

export function getSlaStatusClassName(status: ReclamationSlaStatus): string {
  switch (status) {
    case "ON_TIME":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "DUE_SOON":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "OVERDUE":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "COMPLETED_ON_TIME":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "COMPLETED_LATE":
      return "border-orange-200 bg-orange-50 text-orange-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export function formatSlaRemaining(minutes: number | null): string {
  if (minutes === null || minutes === 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}
