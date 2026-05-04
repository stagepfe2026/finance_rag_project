import { ChevronDown, FileSpreadsheet, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";


type DocumentsPageHeaderProps = {
  onExportPdf: () => void;
  onExportExcel: () => void;
  isExportingPdf: boolean;
  isExportingExcel: boolean;
};

export default function DocumentsPageHeader({
  onExportPdf,
  onExportExcel,
  isExportingPdf,
  isExportingExcel,
}: DocumentsPageHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isBusy = isExportingPdf || isExportingExcel;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="px-2 text-xl font-bold capitalize tracking-tight text-black">
          Liste <span className="text-red-700">documents</span>
        </h1>
      </div>

      <div ref={menuRef} className="relative flex items-center gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => setIsOpen((value) => !value)}
          className="inline-flex h-8 items-center gap-1.5 rounded border border-[#e5eaf2] bg-white px-3 text-[11px] font-semibold text-[#071f3d] transition-colors hover:border-[#8a96ad] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileText size={16} />
          Exporter
          <ChevronDown size={14} className={`transition ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen ? (
          <div className="absolute right-0 top-9 z-20 min-w-[180px] rounded border border-[#e5eaf2] bg-white p-1.5 shadow-lg">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                setIsOpen(false);
                onExportPdf();
              }}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-[12px] text-[#071f3d] hover:bg-[#f7f9fc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileText size={15} className="text-[#9d0208]" />
              {isExportingPdf ? "Generation du PDF..." : "PDF"}
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                setIsOpen(false);
                onExportExcel();
              }}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-[12px] text-[#071f3d] hover:bg-[#f7f9fc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileSpreadsheet size={15} className="text-[#1d6f42]" />
              {isExportingExcel ? "Generation du fichier Excel..." : "Excel"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
