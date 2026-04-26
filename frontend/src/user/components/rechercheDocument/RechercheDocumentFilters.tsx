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
  results: DocumentSearchItem[];
  onCategoriesChange: (value: DocumentCategoryValue[]) => void;
  onTitleChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
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
  results,
  onCategoriesChange,
  onTitleChange,
  onDateFromChange,
  onDateToChange,
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
    <aside className="flex h-full min-h-0 flex-col gap-3 rounded-[22px] border border-[#e8d9d6] bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-[#671a12]">Filtres</h2>
      </div>

      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
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
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#ead9d6] bg-[#fbf7f6] text-sm font-medium text-[#5a4e4b] transition hover:border-[#cfa29c] hover:text-[#b2342c]"
      >
        <RotateCcw size={14} />
        Reinitialiser
      </button>
    </aside>
  );
}
