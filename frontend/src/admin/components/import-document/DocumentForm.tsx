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

        <div className="flex items-center gap-3 rounded-xl border border-[#ebe5e4] bg-[#fcfbfb] px-3.5 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#cf2027] text-[9px] font-semibold text-white">
            {fileMeta?.extensionLabel ?? "FILE"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-[#111111]">
              {fileMeta?.name ?? "Aucun fichier sélectionné"}
            </p>
            <p className="text-[10px] text-[#8c8583]">
              {fileMeta ? `${fileMeta.extensionLabel} • ${fileMeta.pageCountLabel} • ${fileMeta.sizeLabel}` : "Sélectionnez un PDF ou un DOCX"}
            </p>
          </div>
          {fileMeta ? (
            <button
              type="button"
              onClick={onClearFile}
              className="text-lg text-[#b2abaa] transition hover:text-gray-700"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

