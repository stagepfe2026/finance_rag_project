import { FileText, X } from "lucide-react";
import {
  documentCategoryLabels,
  legalDocumentTypeLabels,
  legalRelationTypeLabels,
  legalStatusLabels,
  type DocumentPreview,
} from "../../../models/document";

type DocumentPreviewAsideProps = {
  preview: DocumentPreview;
  isLoading: boolean;
  error: string;
  onClose: () => void;
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export default function DocumentPreviewAside({
  preview,
  isLoading,
  error,
  onClose,
}: DocumentPreviewAsideProps) {
  return (
    <aside className="w-full rounded border border-[#e5eaf2] bg-white xl:w-[360px] xl:min-w-[360px]">
      <div className="flex items-start justify-between border-b border-[#e5eaf2] px-4 py-2">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-red-700">
            Apercu Word
          </p>
          <h2 className="text-sm font-bold text-[#071f3d]">{preview.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-2 text-[#8a96ad] hover:bg-[#f7f9fc] hover:text-[#071f3d]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <div className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3 py-2">
            <p className="text-[#5f6680]">Categorie</p>
            <p className="mt-1 font-semibold text-[#071f3d]">{documentCategoryLabels[preview.category]}</p>
          </div>
          <div className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3 py-2">
            <p className="text-[#5f6680]">Date</p>
            <p className="mt-1 font-semibold text-[#071f3d]">{formatDate(preview.createdAt)}</p>
          </div>
          <div className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3 py-2">
            <p className="text-[#5f6680]">Type juridique</p>
            <p className="mt-1 font-semibold text-[#071f3d]">{legalDocumentTypeLabels[preview.documentType]}</p>
          </div>
          <div className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3 py-2">
            <p className="text-[#5f6680]">Statut juridique</p>
            <p className="mt-1 font-semibold text-[#071f3d]">{legalStatusLabels[preview.legalStatus]}</p>
          </div>
        </div>

        {preview.version || preview.relationType !== "none" ? (
          <div className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3 py-3 text-[12px] leading-5 text-[#071f3d]">
            {preview.version ? <p>Version : {preview.version}</p> : null}
            {preview.relationType !== "none" ? (
              <p>
                Relation : {legalRelationTypeLabels[preview.relationType]}
                {preview.relatedDocumentId ? ` (${preview.relatedDocumentId})` : ""}
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-red-700">
            <FileText size={14} />
            Contenu
          </div>
          <div className="mt-2 max-h-[520px] overflow-y-auto whitespace-pre-wrap rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3 py-3 text-[12px] leading-6 text-[#071f3d]">
            {isLoading ? "Chargement de l apercu..." : error ? error : preview.content}
          </div>
        </div>
      </div>
    </aside>
  );
}
