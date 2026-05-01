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
      <h3 className="text-xs font-semibold text-[#1d1d1d]">Nom du document</h3>

      <input
        type="text"
        value={titleFilter}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Nom du document"
        className="mt-2 h-10 w-full rounded-xl border border-[#e9ddda] bg-[#fcfaf9] px-3 text-[13px] text-[#393332] outline-none placeholder:text-[#a19490] focus:border-[#9d0208]"
      />
    </section>
  );
}
