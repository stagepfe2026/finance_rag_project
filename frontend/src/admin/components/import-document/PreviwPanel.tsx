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
    <div className="rounded-l border border-[#ede7e5]  shadow-[0_10px_35px_rgba(87,51,39,0.04)]">
      <div className="border-b border-[#f0e8e6] px-4 py-3">
        <h2 className="border-l-2 border-[#cf2027] pl-2 text-[13px] font-semibold text-[#111111]">
          Preview
        </h2>
      </div>

      <div className="p-4">
        <h3 className="truncate text-[13px] font-medium text-[#111111]">{fileName}</h3>
        <p className="mt-1 text-[11px] text-[#8b8482]">
          {fileTypeLabel} • {pageCount ? `${pageCount} pages` : "--"} • {fileSizeLabel}
        </p>

        {isLoading ? (
          <div className="mt-4 rounded-xl border border-[#ece5e3] bg-[#fcfbfb] px-4 py-8 text-center text-[12px] text-[#7a7472]">
            Génération de la prévisualisation...
          </div>
        ) : previewItems.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <div className="flex gap-3 pb-2">
              {previewItems.map((page) => (
                <div key={page.pageNumber} className="group min-w-[88px] cursor-pointer">
                  <div className="mb-1.5 text-[10px] font-semibold text-[#cf2027]">{page.pageNumber}</div>
                  <img
                    src={page.imageUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="h-[124px] w-[88px] rounded-lg border border-[#ece5e3] bg-[#fcfbfb] object-cover shadow-sm transition duration-200 group-hover:scale-[1.02] group-hover:shadow-md"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-[#ece5e3] bg-[#fcfbfb] px-4 py-8 text-center text-[12px] text-[#7a7472]">
            {message || "Choisissez un document pour afficher sa prévisualisation."}
          </div>
        )}
      </div>
    </div>
  );
}

