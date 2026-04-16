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
    <div className="mt-4 rounded-2xl border border-[#efe3e1] bg-[#fcfaf9] p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d6c68]">
        <FileText size={13} />
        Contenu du document
      </div>

      <div className="mt-3 max-h-[480px] overflow-y-auto whitespace-pre-wrap pr-2 text-[13px] leading-7 text-[#383130]">
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