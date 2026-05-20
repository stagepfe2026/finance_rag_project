import { Clock3, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  query: string;
  recentSearches: string[];
  sortBy: "recent" | "title";
  onQueryChange: (value: string) => void;
  onSortChange: (value: "recent" | "title") => void;
};

export default function RechercheDocumentSearchBar({
  query,
  recentSearches,
  sortBy,
  onQueryChange,
  onSortChange,
}: Props) {
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setIsRecentOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex w-full flex-col gap-2 md:flex-row md:items-center">
      <div className="relative flex-1" ref={searchContainerRef}>
        <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 transition focus-within:border-[#9d0208] focus-within:bg-white">
          <Search size={15} className="text-[#273043]" />
          <input
            type="text"
            value={query}
            onFocus={() => setIsRecentOpen(true)}
            onClick={() => setIsRecentOpen(true)}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Recherche par mot-cle ou phrase..."
            className="w-full bg-transparent text-[13px] text-[#273043] outline-none placeholder:text-slate-400"
          />
        </div>

        {isRecentOpen ? (
          <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_16px_32px_rgba(17,24,39,0.08)]">
            <div className="border-b border-slate-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Dernieres recherches
            </div>

            {recentSearches.length > 0 ? (
              <div className="py-1.5">
                {recentSearches.slice(0, 5).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-label={`Relancer la recherche ${item}`}
                    onClick={() => {
                      onQueryChange(item);
                      setIsRecentOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#273043] transition hover:bg-slate-50"
                  >
                    <Clock3 size={14} className="shrink-0 text-[#9b8f8b]" />
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-3 text-[12px] text-slate-500">Aucune recherche recente.</div>
            )}
          </div>
        ) : null}
      </div>

      <select
        value={sortBy}
        onChange={(event) => onSortChange(event.target.value as "recent" | "title")}
        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] font-medium text-[#273043] outline-none transition focus:border-[#9d0208] focus:bg-white md:w-[150px]"
      >
        <option value="recent">Plus recents</option>
        <option value="title">Titre A-Z</option>
      </select>
    </div>
  );
}
