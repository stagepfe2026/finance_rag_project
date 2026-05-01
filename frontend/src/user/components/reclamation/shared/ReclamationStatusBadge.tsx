import type { ReclamationStatus } from "../../../../models/reclamation";

const statusConfig: Record<ReclamationStatus, { label: string; className: string }> = {
  PENDING: {
    label: "En attente",
    className: "border border-amber-200 bg-amber-50 text-amber-700",
  },
  IN_PROGRESS: {
    label: "En cours",
    className: "border border-[#f2d8d5] bg-[#fff3f1] text-[#9d0208]",
  },
  RESOLVED: {
    label: "Traitee",
    className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  FAILED: {
    label: "A revoir",
    className: "border border-rose-200 bg-rose-50 text-rose-700",
  },
};

type ReclamationStatusBadgeProps = {
  status: ReclamationStatus;
};

export default function ReclamationStatusBadge({ status }: ReclamationStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex rounded-xl px-2.5 py-0.5 text-[12px] font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
