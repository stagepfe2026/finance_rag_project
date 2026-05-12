import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { PreviewItem } from "../../../models/import-document";

type PreviewPanelProps = {
  fileName: string;
  fileTypeLabel: string;
  pageCount: number | null;
  fileSizeLabel: string;
  previewItems: PreviewItem[];
  textPreview: string;
  wordCount: number | null;
  isLoading: boolean;
  message: string;
};

export default function PreviewPanel({
  fileName,
  fileTypeLabel,
  pageCount,
  fileSizeLabel,
  previewItems,
  textPreview,
  wordCount,
  isLoading,
  message,
}: PreviewPanelProps) {
  const [activePageIndex, setActivePageIndex] = useState<number | null>(null);
  const activePage = activePageIndex === null ? null : previewItems[activePageIndex] ?? null;

  useEffect(() => {
    if (activePageIndex === null) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActivePageIndex(null);
      } else if (event.key === "ArrowLeft") {
        setActivePageIndex((current) => (current === null ? current : Math.max(0, current - 1)));
      } else if (event.key === "ArrowRight") {
        setActivePageIndex((current) =>
          current === null ? current : Math.min(previewItems.length - 1, current + 1),
        );
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePageIndex, previewItems.length]);

  return (
    <div className="rounded-lg border border-[#e5eaf2] bg-white">
      <div className="border-b border-[#e5eaf2] px-4 py-2">
        <h2 className="text-sm font-bold text-[#071f3d]">Preview</h2>
      </div>

      <div className="p-4">
        <h3 className="truncate text-[13px] font-semibold text-[#071f3d]">{fileName}</h3>
        <p className="mt-1 text-[11px] text-[#8a96ad]">
          {fileTypeLabel} • {pageCount ? `${pageCount} pages` : wordCount !== null ? `${wordCount} mots` : "--"} • {fileSizeLabel}
        </p>

        {isLoading ? (
          <div className="mt-4 rounded border border-[#e5eaf2] bg-[#f7f9fc] px-4 py-8 text-center text-[12px] text-[#8a96ad]">
            Génération de la prévisualisation...
          </div>
        ) : textPreview ? (
          <div className="mt-4 rounded border border-[#e5eaf2] bg-[#f7f9fc]">
            <div className="border-b border-[#e5eaf2] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9d0208]">
              Contenu texte du document Word
            </div>
            <div className="max-h-[260px] overflow-y-auto whitespace-pre-wrap px-3 py-3 text-[12px] leading-6 text-[#071f3d]">
              {textPreview}
            </div>
          </div>
        ) : previewItems.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <div className="flex gap-3 pb-2">
              {previewItems.map((page, index) => (
                <button
                  key={page.pageNumber}
                  type="button"
                  onClick={() => setActivePageIndex(index)}
                  className="group min-w-[88px] cursor-pointer text-left"
                >
                  <div className="mb-1.5 text-[10px] font-semibold text-[#9d0208]">{page.pageNumber}</div>
                  <img
                    src={page.imageUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="h-[124px] w-[88px] rounded border border-[#e5eaf2] bg-[#f7f9fc] object-cover shadow-sm transition duration-200 group-hover:scale-[1.02] group-hover:shadow-md"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded border border-[#e5eaf2] bg-[#f7f9fc] px-4 py-8 text-center text-[12px] text-[#8a96ad]">
            {message || "Choisissez un document pour afficher sa prévisualisation."}
          </div>
        )}
      </div>
      {activePage ? (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90 px-2 py-2">
          <button
            type="button"
            onClick={() => setActivePageIndex(null)}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#071f3d] shadow-lg transition hover:bg-[#f7f9fc]"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>

          {previewItems.length > 1 ? (
            <button
              type="button"
              onClick={() => setActivePageIndex((current) => (current === null ? current : Math.max(0, current - 1)))}
              disabled={activePageIndex === 0}
              className="absolute left-5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#071f3d] shadow-lg transition hover:bg-[#f7f9fc] disabled:opacity-40"
              aria-label="Page precedente"
            >
              <ChevronLeft size={18} />
            </button>
          ) : null}

          <div className="flex h-[98vh] w-[98vw] flex-col items-center justify-center gap-2">
            <img
              src={activePage.imageUrl}
              alt={`Page ${activePage.pageNumber}`}
              className="max-h-[94vh] max-w-[96vw] rounded bg-white object-contain shadow-2xl"
            />
            <p className="rounded bg-white px-3 py-1 text-[11px] font-semibold text-[#071f3d]">
              Page {activePage.pageNumber}
            </p>
          </div>

          {previewItems.length > 1 ? (
            <button
              type="button"
              onClick={() =>
                setActivePageIndex((current) =>
                  current === null ? current : Math.min(previewItems.length - 1, current + 1),
                )
              }
              disabled={activePageIndex === previewItems.length - 1}
              className="absolute right-5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#071f3d] shadow-lg transition hover:bg-[#f7f9fc] disabled:opacity-40"
              aria-label="Page suivante"
            >
              <ChevronRight size={18} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
