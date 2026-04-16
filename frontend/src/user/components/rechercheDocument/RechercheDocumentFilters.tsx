import { RotateCcw } from "lucide-react";

import type { DocumentCategoryValue, DocumentSearchItem } from "../../../models/document";
import RechercheDocumentCategoryFilter from "./RechercheDocumentCategoryFilter";
import RechercheDocumentDateFilter from "./RechercheDocumentDateFilter";
import RechercheDocumentNameFilter from "./RechercheDocumentNameFilter";

type Props = {
  selectedCategories: DocumentCategoryValue[];
  titleFilter: string;
  dateFrom: string;
  dateTo: string;
  favoritesOnly: boolean;
  results: DocumentSearchItem[];
  onCategoriesChange: (value: DocumentCategoryValue[]) => void;
  onTitleChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onFavoritesOnlyChange: (value: boolean) => void;
  onReset: () => void;
};

const categoryOrder: DocumentCategoryValue[] = [
  "finance",
  "legal",
  "hr",
  "compliance",
  "other",
];

export default function RechercheDocumentFilters({
  selectedCategories,
  titleFilter,
  dateFrom,
  dateTo,
  favoritesOnly,
  results,
  onCategoriesChange,
  onTitleChange,
  onDateFromChange,
  onDateToChange,
  onFavoritesOnlyChange,
  onReset,
}: Props) {
  const categoryCounts = categoryOrder.reduce<Record<DocumentCategoryValue, number>>(
    (accumulator, category) => {
      accumulator[category] = results.filter((item) => item.category === category).length;
      return accumulator;
    },
    {
      finance: 0,
      legal: 0,
      hr: 0,
      compliance: 0,
      other: 0,
    },
  );

  return (
    <aside className="space-y-4 rounded-xl border border-[#e8d9d6] bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-[#671a12]">Filtres</h2>
      </div>

      <RechercheDocumentCategoryFilter
        selectedCategories={selectedCategories}
        categoryCounts={categoryCounts}
        onCategoriesChange={onCategoriesChange}
      />

      <RechercheDocumentDateFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
      />

      <RechercheDocumentNameFilter
        titleFilter={titleFilter}
        onTitleChange={onTitleChange}
      />

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#efe3e1] px-3 py-3 text-sm text-[#393332]">
        <input
          type="checkbox"
          checked={favoritesOnly}
          onChange={(event) => onFavoritesOnlyChange(event.target.checked)}
          className=" rounded border-[#d6c4c1] accent-[#b2342c]"
        />
        Favoris uniquement
      </label>

      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#ead9d6] bg-[#fbf7f6] text-sm font-medium text-[#5a4e4b] transition hover:border-[#cfa29c] hover:text-[#b2342c]"
      >
        <RotateCcw size={14} />
        Réinitialiser
      </button>
    </aside>
  );
}