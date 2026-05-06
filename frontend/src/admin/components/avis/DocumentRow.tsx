import { FileWarning, RefreshCw } from "lucide-react";

import type { ChatFeedbackDocumentStat } from "../../../models/chat-feedback";

type DocumentRowProps = {
  document: ChatFeedbackDocumentStat;
  onReindex: (document: ChatFeedbackDocumentStat) => void;
  isBusy: boolean;
};

export default function DocumentRow({ document, onReindex, isBusy }: DocumentRowProps) {
  return (
    <tr className="border-t border-[#e5eaf2] transition-colors hover:bg-[#f7f9fc]">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#f5e6e7] text-[#9d0208]">
            <FileWarning size={14} />
          </span>
          <div className="min-w-0">
            <p className="max-w-[260px] truncate text-xs font-semibold text-[#071f3d]">{document.documentName}</p>
            <p className="text-[10px] text-[#8a96ad]">{document.documentType || document.category || "Source chat"}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="rounded bg-[#f5e6e7] px-2 py-0.5 text-[10px] font-semibold text-[#9d0208]">
          {document.signalements}
        </span>
      </td>
      <td className="px-4 py-3 text-center text-xs font-semibold text-[#071f3d]">{document.likes}</td>
      <td className="px-4 py-3 text-center text-xs font-semibold text-[#9d0208]">{document.dislikes}</td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          disabled={!document.documentId || isBusy}
          onClick={() => onReindex(document)}
          className="inline-flex items-center gap-1.5 rounded border border-[#e5eaf2] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#071f3d] transition-colors hover:border-[#071f3d] hover:bg-[#f7f9fc] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RefreshCw size={13} className={isBusy ? "animate-spin" : ""} />
          Réindexer
        </button>
      </td>
    </tr>
  );
}
