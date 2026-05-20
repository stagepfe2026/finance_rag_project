import {
  documentCategoryLabels,
  type DocumentCategoryValue,
} from "../../../models/document";

type Props = {
  selectedCategories: DocumentCategoryValue[];
  categoryCounts: Record<DocumentCategoryValue, number>;
  onCategoriesChange: (value: DocumentCategoryValue[]) => void;
};

const categoryOrder: DocumentCategoryValue[] = [
  "finance",
  "notes",
  "conventions",
  "recueil",
  "other",
];

export default function RechercheDocumentCategoryFilter({
  selectedCategories,
  categoryCounts,
  onCategoriesChange,
}: Props) {
  function toggleCategory(category: DocumentCategoryValue) {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((item) => item !== category));
      return;
    }

    onCategoriesChange([...selectedCategories, category]);
  }

  return (
    <section>
      <h4 className="text-xs font-semibold text-[#273043]">Catégorie</h4>

      <div className="mt-2 space-y-1.5">
        {categoryOrder.map((category) => {
          const checked = selectedCategories.includes(category);

          return (
            <label
              key={category}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-2.5 py-2 transition hover:border-[#9d0208] hover:bg-slate-50"
            >
              <span className="flex min-w-0 items-center gap-2 text-[12px] text-[#273043]">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(category)}
                  className="h-4 w-4 rounded border-[#d6c4c1] accent-[#9d0208]"
                />
                <span className="truncate">{documentCategoryLabels[category]}</span>
              </span>

              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {categoryCounts[category]}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
