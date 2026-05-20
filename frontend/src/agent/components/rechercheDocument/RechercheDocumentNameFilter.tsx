type Props = {
  titleFilter: string;
  onTitleChange: (value: string) => void;
};

export default function RechercheDocumentNameFilter({
  titleFilter,
  onTitleChange,
}: Props) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-[#273043]">Nom du document</h3>

      <input
        type="text"
        value={titleFilter}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Nom du document"
        className="mt-2 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[12px] text-[#273043] outline-none placeholder:text-slate-400 transition focus:border-[#9d0208] focus:bg-white"
      />
    </section>
  );
}
