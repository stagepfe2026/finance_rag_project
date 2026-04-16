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
  "legal",
  "hr",
  "compliance",
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
      <h3 className="text-sm font-semibold text-[#1d1d1d]">Catégorie</h3>

      <div className="mt-2 space-y-2">
        {categoryOrder.map((category) => {
          const checked = selectedCategories.includes(category);

          return (
            <label
              key={category}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-[#efe3e1] px-3 py-2 transition hover:border-[#d8b5b0]"
            >
              <span className="flex items-center gap-2 text-[13px] text-[#393332]">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(category)}
                  className="h-4 w-4 rounded border-[#d6c4c1] accent-[#b2342c]"
                />
                {documentCategoryLabels[category]}
              </span>

              <span className="rounded-full bg-[#f6efee] px-2 py-0.5 text-[11px] text-[#7d6c68]">
                {categoryCounts[category]}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}