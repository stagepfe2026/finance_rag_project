import type { CategoryOption, CategoryValue, FileMeta } from "../../../models/import-document";

type DocumentFormProps = {
  category: CategoryValue;
  categoryOptions: CategoryOption[];
  title: string;
  description: string;
  fileMeta: FileMeta | null;
  onCategoryChange: (value: CategoryValue) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onClearFile: () => void;
};

export default function DocumentForm({
  category,
  categoryOptions,
  title,
  description,
  fileMeta,
  onCategoryChange,
  onTitleChange,
  onDescriptionChange,
  onClearFile,
}: DocumentFormProps) {
  return (
    <div className="rounded-l border border-[#ede7e5]  p-4 shadow-[0_10px_35px_rgba(87,51,39,0.04)]">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#111111]">
            Category
          </label>
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value as CategoryValue)}
            className="h-10 w-full rounded-xl border border-[#ebe5e4] bg-white px-3.5 text-[12px] text-[#4c4847] outline-none transition focus:border-[#cf2027]"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#111111]">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Le titre sera rempli automatiquement"
            className="h-10 w-full rounded-xl border border-[#ebe5e4] bg-white px-3.5 text-[12px] text-[#4c4847] outline-none transition focus:border-[#cf2027]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#111111]">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Résumé généré ou description métier du document"
            className="w-full rounded-xl border border-[#ebe5e4] bg-white px-3.5 py-2.5 text-[12px] text-[#4c4847] outline-none transition focus:border-[#cf2027]"
          />
        </div>

       
      </div>
    </div>
  );
}

