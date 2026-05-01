import { Search, ChevronDown } from "lucide-react";
import { categoryOptions } from "../../../models/import-document";
import { documentStatusLabels, type DocumentStatusValue } from "../../../models/document";

type DocumentsFilterBarProps = {
  search: string;
  category: "all" | (typeof categoryOptions)[number]["value"];
  status: "all" | DocumentStatusValue;
  total: number;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: "all" | (typeof categoryOptions)[number]["value"]) => void;
  onStatusChange: (value: "all" | DocumentStatusValue) => void;
  onReset: () => void;
};

export default function DocumentsFilterBar({
  search,
  category,
  status,
  total,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onReset,
}: DocumentsFilterBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a9a]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="h-9 w-full rounded-xl border border-[#ede7e5] bg-white pl-9 pr-3 text-[12px] text-[#111111] outline-none placeholder:text-[#9a9a9a] focus:border-[#9d0208]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-[#7a7472]">{total} documents</p>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value as DocumentsFilterBarProps["category"])}
              className="h-9 appearance-none rounded-xl border border-[#ede7e5] bg-white px-3 pr-9 text-[12px] text-[#111111] outline-none focus:border-[#9d0208]"
            >
              <option value="all">Toutes catégories</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8b8b]"
            />
          </div>

          <div className="relative">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as DocumentsFilterBarProps["status"])}
              className="h-9 appearance-none rounded-xl border border-[#ede7e5] bg-white px-3 pr-9 text-[12px] text-[#111111] outline-none focus:border-[#9d0208]"
            >
              <option value="all">Tous statuts</option>
              {Object.entries(documentStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8b8b]"
            />
          </div>

          <button
            onClick={onReset}
            className="inline-flex h-9 items-center rounded-xl border border-[#ede7e5] bg-white px-3 text-[12px] font-medium text-[#111111] hover:bg-[#fafafa]"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}
