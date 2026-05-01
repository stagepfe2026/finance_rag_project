import { Ellipsis } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { AuditActivity } from "../../../models/audit";
import { exportAuditToExcel, exportAuditToJson, exportAuditToPdf } from "../../utils/auditExports";

type AuditExportMenuProps = {
  activities: AuditActivity[];
  prefix: string;
};

export default function AuditExportMenu({ activities, prefix }: AuditExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  function handleExport(exportAction: () => void) {
    exportAction();
    setIsOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-white transition ${
          isOpen
            ? "border-[#9d0208] text-[#9d0208] shadow-[0_10px_24px_rgba(207,32,39,0.14)]"
            : "border-[#e3d8d5] text-[#6d605d] hover:border-[#9d0208] hover:text-[#9d0208]"
        }`}
      >
        <Ellipsis size={18} />
      </button>

      <div
        role="menu"
        className={`absolute right-0 top-[calc(100%+8px)] z-50 w-48 origin-top-right rounded-2xl border border-[#eadfdd] bg-white p-2 shadow-[0_20px_60px_rgba(47,28,28,0.14)] transition duration-150 ${
          isOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => handleExport(() => exportAuditToJson(activities, prefix))}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-[#443b39] transition hover:bg-[#fff4f3] hover:text-[#9d0208]"
        >
          JSON
          <span className="text-[11px] text-[#9a8b87]">.json</span>
        </button>
        <button
          type="button"
          onClick={() => handleExport(() => exportAuditToExcel(activities, prefix))}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-[#443b39] transition hover:bg-[#fff4f3] hover:text-[#9d0208]"
        >
          Excel
          <span className="text-[11px] text-[#9a8b87]">.xlsx</span>
        </button>
        <button
          type="button"
          onClick={() => handleExport(() => exportAuditToPdf(activities, prefix))}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-[#443b39] transition hover:bg-[#fff4f3] hover:text-[#9d0208]"
        >
          PDF
          <span className="text-[11px] text-[#9a8b87]">.pdf</span>
        </button>
      </div>
    </div>
  );
}
