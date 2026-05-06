import { Search, X } from "lucide-react";

type SortOption = "signalements" | "likes" | "dislikes";

type AvisFilterBarProps = {
  search: string;
  sortBy: SortOption;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  resultCount: number;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "signalements", label: "Signalements" },
  { value: "likes", label: "Likes" },
  { value: "dislikes", label: "Dislikes" },
];

export default function AvisFilterBar({
  search,
  sortBy,
  onSearchChange,
  onSortChange,
  resultCount,
}: AvisFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded border border-[#e5eaf2] bg-white px-3 py-2">
      {/* Search input */}
      <div className="relative flex-1 min-w-[180px]">
        <Search
          size={13}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a96ad]"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un document…"
          className="h-8 w-full rounded border border-[#e5eaf2] bg-[#f7f9fc] pl-7 pr-7 text-[12px] text-[#071f3d] placeholder-[#8a96ad] outline-none transition-colors focus:border-[#071f3d] focus:bg-white"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#8a96ad] hover:text-[#071f3d]"
            aria-label="Effacer la recherche"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Sort selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium text-[#8a96ad] whitespace-nowrap">Trier par</span>
        <div className="flex items-center gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSortChange(opt.value)}
              className={[
                "h-7 rounded px-2.5 text-[11px] cursor-pointer font-semibold transition-colors",
                sortBy === opt.value
                  ? "bg-[#071f3d] text-white"
                  : "border border-[#e5eaf2] text-[#5f6680] hover:border-[#071f3d] hover:text-[#071f3d]",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <span className="rounded bg-[#f7f9fc] border border-[#e5eaf2] px-2.5 py-1 text-[10px] font-semibold text-[#071f3d] whitespace-nowrap">
        {resultCount} résultat{resultCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
