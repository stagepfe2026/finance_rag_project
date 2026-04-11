type DocumentsPaginationProps = {
  total: number;
};

export default function DocumentsPagination({ total }: DocumentsPaginationProps) {
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <span className="text-[12px] text-[#7a7472]">Total: {total}</span>
    </div>
  );
}
