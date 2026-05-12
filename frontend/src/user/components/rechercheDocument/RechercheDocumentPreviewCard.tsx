import { FileText } from "lucide-react";
import type { DocumentPreview } from "../../../models/document";
import RechercheDocumentHighlightText from "./RechercheDocumentHighlightText";

type Props = {
  preview: DocumentPreview | null;
  query: string;
  isLoading: boolean;
  error: string;
};

export default function RechercheDocumentPreviewCard({
  preview,
  query,
  isLoading,
  error,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        <FileText size={13} />
        Contenu du document
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap pr-2 text-[12px] leading-6 text-[#273043]">
        {isLoading ? (
          "Chargement du contenu..."
        ) : error ? (
          error
        ) : preview ? (
          <RechercheDocumentHighlightText text={preview.content} query={query} />
        ) : (
          "Aucun aperçu disponible."
        )}
      </div>
    </div>
  );
}
