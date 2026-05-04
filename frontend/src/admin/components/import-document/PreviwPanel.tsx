import type { PreviewItem } from "../../../models/import-document";

type PreviewPanelProps = {
  fileName: string;
  fileTypeLabel: string;
  pageCount: number | null;
  fileSizeLabel: string;
  previewItems: PreviewItem[];
  isLoading: boolean;
  message: string;
};

export default function PreviewPanel({
  fileName,
  fileTypeLabel,
  pageCount,
  fileSizeLabel,
  previewItems,
  isLoading,
  message,
}: PreviewPanelProps) {
  return (
    <div className="rounded-lg border border-[#e5eaf2] bg-white">
      <div className="border-b border-[#e5eaf2] px-4 py-2">
        <h2 className="text-sm font-bold text-[#071f3d]">Preview</h2>
      </div>

      <div className="p-4">
        <h3 className="truncate text-[13px] font-semibold text-[#071f3d]">{fileName}</h3>
        <p className="mt-1 text-[11px] text-[#8a96ad]">
          {fileTypeLabel} • {pageCount ? `${pageCount} pages` : "--"} • {fileSizeLabel}
        </p>

        {isLoading ? (
          <div className="mt-4 rounded border border-[#e5eaf2] bg-[#f7f9fc] px-4 py-8 text-center text-[12px] text-[#8a96ad]">
            Génération de la prévisualisation...
          </div>
        ) : previewItems.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <div className="flex gap-3 pb-2">
              {previewItems.map((page) => (
                <div key={page.pageNumber} className="group min-w-[88px] cursor-pointer">
                  <div className="mb-1.5 text-[10px] font-semibold text-[#9d0208]">{page.pageNumber}</div>
                  <img
                    src={page.imageUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="h-[124px] w-[88px] rounded border border-[#e5eaf2] bg-[#f7f9fc] object-cover shadow-sm transition duration-200 group-hover:scale-[1.02] group-hover:shadow-md"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded border border-[#e5eaf2] bg-[#f7f9fc] px-4 py-8 text-center text-[12px] text-[#8a96ad]">
            {message || "Choisissez un document pour afficher sa prévisualisation."}
          </div>
        )}
      </div>
    </div>
  );
}
