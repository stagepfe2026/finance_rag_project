import { documentStatusLabels, type DocumentStatusValue } from "../../../models/document";

type DocumentStatusBadgeProps = {
  status: DocumentStatusValue;
};

export default function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const styles: Record<DocumentStatusValue, string> = {
    indexed: "bg-[#eef2f8] text-[#071f3d]",
    processing: "bg-[#f5e6e7] text-[#9d0208]",
    failed: "bg-[#f7f9fc] text-[#6b7280]",
  };

  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[status]}`}>
      {documentStatusLabels[status]}
    </span>
  );
}
