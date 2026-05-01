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
  "notes",
  "conventions",
  "recueil",
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
      notes: 0,
      conventions: 0,
      recueil: 0,
      other: 0,
    },
  );

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-[#273043]">Filtres</h2>
      
      </div>

      <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-5 py-4">
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

      <div className="border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={onReset}
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-[#273043] transition hover:border-[#273043] hover:bg-white"
        >
          Réinitialiser
        </button>
      </div>
    </aside>
  );
}