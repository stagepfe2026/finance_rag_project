import { useState } from "react";
import { documentCategoryLabels, type DocumentItem } from "../../../models/document";
import DocumentStatusBadge from "./DocumentStatusBadge";
import DocumentActionsMenu from "./DocumentActionsMenu";

type DocumentRowProps = {
  document: DocumentItem;
  onConsult: (document: DocumentItem) => void;
  onDeleteFromIndex: (document: DocumentItem) => Promise<void>;
  onReindex: (document: DocumentItem) => Promise<void>;
};

function formatDocumentDate(document: DocumentItem) {
  const rawDate = document.realizedAt || document.indexedAt || document.createdAt;
  if (!rawDate) {
    return "-";
  }

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export default function DocumentRow({ document, onConsult, onDeleteFromIndex, onReindex }: DocumentRowProps) {
  const [isBusy, setIsBusy] = useState(false);

  async function handleDeleteFromIndex() {
    setIsBusy(true);
    try {
      await onDeleteFromIndex(document);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReindex() {
    setIsBusy(true);
    try {
      await onReindex(document);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <tr className="border-t border-[#e5eaf2] align-top transition-colors hover:bg-[#f7f9fc]">
      <td className="px-4 py-3">
        <div className="max-w-[420px]">
          <p className="truncate text-xs font-semibold leading-5 text-[#071f3d]">{document.title}</p>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="inline-flex rounded bg-[#f5e6e7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9d0208]">
          {documentCategoryLabels[document.category]}
        </span>
      </td>

      <td className="px-4 py-3 text-xs text-[#5f6680]">{formatDocumentDate(document)}</td>

      <td className="px-4 py-3">
        <DocumentStatusBadge status={document.documentStatus} />
      </td>

      <td className="px-4 py-3">
        <DocumentActionsMenu
          onView={() => onConsult(document)}
          onDeleteFromIndex={handleDeleteFromIndex}
          onReindex={handleReindex}
          isBusy={isBusy}
        />
      </td>
    </tr>
  );
}
