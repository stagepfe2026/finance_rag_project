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
    <tr className="border-b border-[#f2ece9] align-top last:border-b-0">
      <td className="px-4 py-3">
        <div className="max-w-[420px] space-y-1">
          <p className="text-[13px] font-medium leading-5 text-[#111111]">{document.title}</p>
          {document.description ? (
            <p className="line-clamp-2 text-[12px] leading-4 text-[#7a7472]">{document.description}</p>
          ) : null}
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="inline-flex rounded-lg bg-[#fff1f2] px-2.5 py-1 text-[11px] font-medium text-[#9d0208]">
          {documentCategoryLabels[document.category]}
        </span>
      </td>

      <td className="px-4 py-3 text-[12px] text-[#7a7472]">{formatDocumentDate(document)}</td>

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
