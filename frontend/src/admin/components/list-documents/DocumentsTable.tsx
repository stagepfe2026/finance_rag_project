import type { DocumentItem } from "../../../models/document";
import DocumentRow from "./DocumentRow";

type DocumentsTableProps = {
  documents: DocumentItem[];
  onConsult: (document: DocumentItem) => void;
  onDeleteFromIndex: (document: DocumentItem) => Promise<void>;
  onReindex: (document: DocumentItem) => Promise<void>;
};

export default function DocumentsTable({
  documents,
  onConsult,
  onDeleteFromIndex,
  onReindex,
}: DocumentsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ede7e5] bg-white">
      <table className="min-w-full border-collapse">
        <thead className="bg-[#fbf8f7]">
          <tr className="border-b border-[#ede7e5]">
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#7a7472]">
              Document
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#7a7472]">
              Categorie
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#7a7472]">
              Date
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#7a7472]">
              Statut
            </th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#7a7472]">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {documents.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              onConsult={onConsult}
              onDeleteFromIndex={onDeleteFromIndex}
              onReindex={onReindex}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
