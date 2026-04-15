import type { ReclamationStatus } from "../../../models/reclamation";

const statusConfig: Record<ReclamationStatus, { label: string; className: string }> = {
  PENDING: {
    label: "En attente",
    className: "bg-rose-50 text-rose-500 border border-rose-200",
  },
  RESOLVED: {
    label: "Résolu",
    className: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  },
  FAILED: {
    label: "En cours",
    className: "bg-orange-50 text-orange-500 border border-orange-200",
  },
};

type ReclamationStatusBadgeProps = {
  status: ReclamationStatus;
};

export default function ReclamationStatusBadge({ status }: ReclamationStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex rounded-md px-2.5 py-0.5 text-[12px] font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}