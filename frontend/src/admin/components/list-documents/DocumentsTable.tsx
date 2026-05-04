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
    <div className="rounded border border-[#e5eaf2] bg-white">
      <div className="flex items-center justify-between border-b border-[#e5eaf2] px-4 py-2">
        <h2 className="mt-0.5 text-sm font-bold text-[#071f3d]">Documents indexes</h2>
        <span className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-2.5 py-1 text-[10px] font-semibold text-[#071f3d]">
          {documents.length} element{documents.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#f7f9fc] text-[10px] font-semibold uppercase text-red-700">
              <th className="whitespace-nowrap px-4 py-2.5">Document</th>
              <th className="whitespace-nowrap px-4 py-2.5">Categorie</th>
              <th className="whitespace-nowrap px-4 py-2.5">Date</th>
              <th className="whitespace-nowrap px-4 py-2.5">Statut</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">Actions</th>
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
    </div>
  );
}
