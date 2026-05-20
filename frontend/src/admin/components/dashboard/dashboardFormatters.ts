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
  finance: "Lois des finances",
  notes: "Notes communes",
  conventions: "Conventions de non double imposition",
  recueil: "Recueils de textes fiscaux",
  other: "Autre documentation utile",
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
