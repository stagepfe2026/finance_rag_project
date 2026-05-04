import { ChevronDown, Search } from "lucide-react";
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
    <div className="rounded border border-[#e5eaf2] bg-white p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8a96ad]"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Rechercher..."
            className="h-9 w-full rounded border border-[#e5eaf2] bg-[#f7f9fc] pl-9 pr-3 text-[12px] text-[#071f3d] outline-none placeholder:text-[#8a96ad] focus:border-[#071f3d]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-2.5 py-1 text-[10px] font-semibold text-[#071f3d]">
            {total} document{total !== 1 ? "s" : ""}
          </span>

          <div className="relative">
            <select
              value={category}
              onChange={(event) => onCategoryChange(event.target.value as DocumentsFilterBarProps["category"])}
              className="h-9 appearance-none rounded border border-[#e5eaf2] bg-white px-3 pr-9 text-[12px] text-[#071f3d] outline-none focus:border-[#071f3d]"
            >
              <option value="all">Toutes categories</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8a96ad]"
            />
          </div>

          <div className="relative">
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value as DocumentsFilterBarProps["status"])}
              className="h-9 appearance-none rounded border border-[#e5eaf2] bg-white px-3 pr-9 text-[12px] text-[#071f3d] outline-none focus:border-[#071f3d]"
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
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8a96ad]"
            />
          </div>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-9 items-center rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3 text-[12px] font-semibold text-black transition-colors hover:border-[#071f3d] hover:bg-[#DEE0E2]"
          >
            Reinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}
