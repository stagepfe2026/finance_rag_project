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
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-[#273043]">
          Documents <span className="text-[#9d0208]">indexes</span>
        </h1>
        <p className="mt-2 text-[13px] text-[#5f6680]">Administration documentaire ministerielle</p>
      </div>

      <div ref={menuRef} className="relative flex items-center gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => setIsOpen((value) => !value)}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dde3ec] bg-white px-4 text-[12px] font-semibold text-[#273043] shadow-sm transition hover:bg-[#f4f7fb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileText size={16} />
          Exporter
          <ChevronDown size={14} className={`transition ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen ? (
          <div className="absolute right-0 top-11 z-20 min-w-[180px] rounded-xl border border-[#dde3ec] bg-white p-1.5 shadow-lg">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                setIsOpen(false);
                onExportPdf();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] text-[#273043] hover:bg-[#f4f7fb] disabled:cursor-not-allowed disabled:opacity-60"
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
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] text-[#273043] hover:bg-[#f4f7fb] disabled:cursor-not-allowed disabled:opacity-60"
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
