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
    <div className="flex h-full min-h-0 flex-col rounded-[18px] border border-[#efe3e1] bg-[#fcfaf9] p-3.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d6c68]">
        <FileText size={13} />
        Contenu du document
      </div>

      <div className="mt-2.5 min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap pr-2 text-[12.5px] leading-6 text-[#383130]">
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
