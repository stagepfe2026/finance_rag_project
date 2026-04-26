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
      <h3 className="text-sm font-semibold text-[#1d1d1d]">Période</h3>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => onDateFromChange(event.target.value)}
          className="h-10 rounded-xl border border-[#e9ddda] bg-[#fcfaf9] px-3 text-[13px] text-[#393332] outline-none focus:border-[#b2342c]"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(event) => onDateToChange(event.target.value)}
          className="h-10 rounded-xl border border-[#e9ddda] bg-[#fcfaf9] px-3 text-[13px] text-[#393332] outline-none focus:border-[#b2342c]"
        />
      </div>
    </section>
  );
}
