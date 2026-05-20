type Props = {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
};

export default function RechercheDocumentDateFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: Props) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-[#273043]">Periode de publication</h3>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => onDateFromChange(event.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[12px] text-[#273043] outline-none transition focus:border-[#9d0208] focus:bg-white"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(event) => onDateToChange(event.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[12px] text-[#273043] outline-none transition focus:border-[#9d0208] focus:bg-white"
        />
      </div>
    </section>
  );
}
