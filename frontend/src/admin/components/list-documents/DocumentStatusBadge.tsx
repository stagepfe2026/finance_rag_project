import { documentStatusLabels, type DocumentStatusValue } from "../../../models/document";

type DocumentStatusBadgeProps = {
  status: DocumentStatusValue;
};

export default function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const styles: Record<DocumentStatusValue, string> = {
    indexed: "bg-[#e7f6ef] text-[#17795a]",
    processing: "bg-[#fff1dc] text-[#c78918]",
    failed: "bg-[#fdeaea] text-[#dc4c4c]",
  };

  return (
    <span className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-medium ${styles[status]}`}>
      {documentStatusLabels[status]}
    </span>
  );
}
