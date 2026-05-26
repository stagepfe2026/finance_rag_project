type DocumentsStatusSummaryProps = {
  indexed?: number;
  processing?: number;
  failed?: number;
};

export default function DocumentsStatusSummary({
  indexed = 0,
  processing = 0,
  failed = 0,
}: DocumentsStatusSummaryProps) {
  const items = [
    { label: "Indexés", value: indexed, sub: "" },
    { label: "En cours d'indexation", value: processing, sub: "" },
    { label: "Échecs", value: failed, sub: "" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded border border-[#e5eaf2] bg-white p-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-red-700">
            {item.label}
          </p>
          <p className="mt-1 text-lg font-bold leading-none tracking-tight text-[#071f3d]">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
