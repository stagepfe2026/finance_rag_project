import { Search } from "lucide-react";

type Props = {
  query: string;
  sortBy: "recent" | "title";
  onQueryChange: (value: string) => void;
  onSortChange: (value: "recent" | "title") => void;
};

export default function RechercheDocumentSearchBar({
  query,
  sortBy,
  onQueryChange,
  onSortChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex h-10 flex-1 items-center gap-2 rounded-full border border-[#ead9d6] bg-[#fcfaf9] px-4">
        <Search size={15} className="text-[#8c7b77]" />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Recherche par mot-clé ou phrase..."
          className="w-full bg-transparent text-[13px] text-[#231f1e] outline-none placeholder:text-[#a19490]"
        />
      </div>

      <select
        value={sortBy}
        onChange={(event) => onSortChange(event.target.value as "recent" | "title")}
        className="h-10 rounded-full border border-[#ead9d6] bg-[#fcfaf9] px-4 text-[12px] text-[#5a4e4b] outline-none"
      >
        <option value="recent">Plus récents</option>
        <option value="title">Titre A-Z</option>
      </select>
    </div>
  );
}