import type { ChatFeedbackDocumentStat } from "../../../models/chat-feedback";
import DocumentRow from "./DocumentRow";

type DocumentsTableProps = {
  documents: ChatFeedbackDocumentStat[];
  busyDocumentId: string | null;
  onReindex: (document: ChatFeedbackDocumentStat) => void;
};

export default function DocumentsTable({ documents, busyDocumentId, onReindex }: DocumentsTableProps) {
  return (
    <section className="overflow-hidden rounded border border-[#e5eaf2] rounded-lg bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#e5eaf2] px-4 py-2">
        <h2 className="mt-0.5 text-sm font-bold text-[#071f3d]">Documents les plus signalés</h2>
        <span className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-2.5 py-1 text-[10px] font-semibold text-[#071f3d]">
          {documents.length} élément{documents.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="bg-[#f7f9fc] text-[10px] font-semibold uppercase text-red-700">
              <th className="whitespace-nowrap px-4 py-2.5">Document</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-center">Signalements</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-center">Likes</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-center">Dislikes</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right">Mesure</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#8a96ad]">
                  Aucun avis chat pour le moment.
                </td>
              </tr>
            ) : (
              documents.map((document) => (
                <DocumentRow
                  key={document.documentId || document.documentName}
                  document={document}
                  onReindex={onReindex}
                  isBusy={busyDocumentId === document.documentId}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
