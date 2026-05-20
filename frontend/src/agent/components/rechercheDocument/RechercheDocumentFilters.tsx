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
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9d0208]">Recherche</p>
        <h2 className="mt-1 text-sm font-semibold text-[#273043]">Filtres</h2>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
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

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        <button
          type="button"
          aria-label="Reinitialiser les filtres de recherche"
          onClick={onReset}
          className="h-9 w-full rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#273043] transition hover:border-[#9d0208]"
        >
          Réinitialiser
        </button>
      </div>
    </aside>
  );
}
