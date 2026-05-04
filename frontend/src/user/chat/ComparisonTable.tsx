export type ComparisonTableRow = Record<string, string | number | null | undefined>;

type ComparisonTableProps = {
  columns: string[];
  rows: ComparisonTableRow[];
  caption?: string;
};

function formatCellValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

export default function ComparisonTable({ columns, rows, caption }: ComparisonTableProps) {
  if (columns.length === 0 || rows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-md border border-[#d1d5db] bg-white">
      {caption ? (
        <div className="border-b border-[#d1d5db] bg-[#f3f4f6] px-3 py-2 text-[11px] font-semibold text-[#111111]">
          {caption}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-[11px] leading-5 text-[#111111]">
          <thead>
            <tr className="bg-[#111111] text-white">
              {columns.map((column) => (
                <th key={column} scope="col" className="border-r border-[#4b5563] px-3 py-2 font-semibold last:border-r-0">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`comparison-row-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-white" : "bg-[#f3f4f6]"}>
                {columns.map((column) => (
                  <td key={`${column}-${rowIndex}`} className="border-r border-t border-[#d1d5db] px-3 py-2 align-top last:border-r-0">
                    {formatCellValue(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
