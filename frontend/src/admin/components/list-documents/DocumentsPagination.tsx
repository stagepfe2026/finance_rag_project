type DocumentsPaginationProps = {
  total: number;
};

export default function DocumentsPagination({ total }: DocumentsPaginationProps) {
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <span className="rounded border border-[#e5eaf2] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#071f3d]">
        Total: {total}
      </span>
    </div>
  );
}
