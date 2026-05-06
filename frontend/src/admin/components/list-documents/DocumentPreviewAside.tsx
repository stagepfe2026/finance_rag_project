import { ExternalLink, FileText, RefreshCw, Trash2, X } from "lucide-react";
import {
  documentCategoryLabels,
  documentStatusLabels,
  legalDocumentTypeLabels,
  legalRelationTypeLabels,
  legalStatusLabels,
  type DocumentItem,
  type DocumentPreview,
} from "../../../models/document";
import DocumentStatusBadge from "./DocumentStatusBadge";

type DocumentPreviewAsideProps = {
  document: DocumentItem;
  preview?: DocumentPreview | null;
  isPreviewLoading?: boolean;
  previewError?: string;
  apiBaseUrl?: string;
  onClose: () => void;
  onReindex?: () => Promise<void>;
  onDeleteFromIndex?: () => Promise<void>;
};

function MetaField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3 py-2">
      <p className="text-[10px] font-medium text-[#8a96ad] uppercase tracking-[0.05em]">{label}</p>
      <div className="mt-1 text-[12px] font-semibold text-[#071f3d]">{value}</div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function normalizeFileType(fileType: string) {
  const value = (fileType || "").toLowerCase();
  if (value.includes("pdf")) return "PDF";
  if (value.includes("word") || value.includes("docx") || value.includes("doc")) return "DOCX";
  if (value.includes("excel") || value.includes("sheet") || value.includes("xlsx")) return "XLSX";
  return value ? value.toUpperCase().slice(0, 10) : "—";
}

export default function DocumentPreviewAside({
  document,
  preview,
  isPreviewLoading = false,
  previewError = "",
  apiBaseUrl,
  onClose,
  onReindex,
  onDeleteFromIndex,
}: DocumentPreviewAsideProps) {
  const isPdf = document.fileType?.toLowerCase().includes("pdf");
  const pdfUrl = apiBaseUrl ? `${apiBaseUrl}/api/v1/documents/${document.id}/file` : null;

  return (
    <aside className="w-full rounded border border-[#e5eaf2] bg-white xl:w-[380px] xl:min-w-[380px] flex flex-col max-h-[calc(100vh-120px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#e5eaf2] px-4 py-3 shrink-0">
        <div className="min-w-0 flex-1 pr-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9d0208]">
            Détails du document
          </p>
          <h2 className="mt-0.5 text-sm font-bold leading-snug text-[#071f3d] line-clamp-2">
            {document.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-1.5 text-[#8a96ad] hover:bg-[#f7f9fc] hover:text-[#071f3d] transition-colors"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 px-4 py-4">
          {/* Status row */}
          <div className="flex items-center justify-between">
            <DocumentStatusBadge status={document.documentStatus} />
            <span className="text-[10px] text-[#8a96ad]">
              {normalizeFileType(document.fileType)}
              {document.fileSize > 0 && ` · ${formatFileSize(document.fileSize)}`}
            </span>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <MetaField label="Catégorie" value={documentCategoryLabels[document.category]} />
            <MetaField label="Ajouté le" value={formatDate(document.createdAt)} />
            <MetaField label="Type juridique" value={legalDocumentTypeLabels[document.documentType]} />
            <MetaField label="Statut juridique" value={legalStatusLabels[document.legalStatus]} />
            {document.datePublication && (
              <MetaField label="Publication" value={formatDate(document.datePublication)} />
            )}
            {document.dateEntreeVigueur && (
              <MetaField label="Entrée en vigueur" value={formatDate(document.dateEntreeVigueur)} />
            )}
            {document.indexedAt && (
              <MetaField label="Indexé le" value={formatDate(document.indexedAt)} />
            )}
            {document.chunksCount != null && (
              <MetaField label="Passages" value={`${document.chunksCount} chunk${document.chunksCount !== 1 ? "s" : ""}`} />
            )}
          </div>

          {/* Version / Relation */}
          {(document.version || document.relationType !== "none") && (
            <div className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3 py-2.5 text-[12px] space-y-1">
              {document.version && (
                <p className="text-[#071f3d]">
                  <span className="text-[#8a96ad]">Version :</span> {document.version}
                </p>
              )}
              {document.relationType !== "none" && (
                <p className="text-[#071f3d]">
                  <span className="text-[#8a96ad]">Relation :</span>{" "}
                  {legalRelationTypeLabels[document.relationType]}
                  {document.relatedDocumentId && (
                    <span className="ml-1 text-[#8a96ad]">({document.relatedDocumentId})</span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Index error */}
          {document.indexError && (
            <div className="rounded border border-[#f3c6cc] bg-[#fdf2f3] px-3 py-2 text-[11px] text-[#9d0208]">
              <p className="font-semibold">Erreur d'indexation</p>
              <p className="mt-0.5 leading-5">{document.indexError}</p>
            </div>
          )}

          {/* Content preview (non-PDF) */}
          {!isPdf && (
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9d0208]">
                <FileText size={13} />
                Contenu
              </div>
              <div className="mt-2 max-h-[300px] overflow-y-auto whitespace-pre-wrap rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3 py-3 text-[12px] leading-6 text-[#071f3d]">
                {isPreviewLoading
                  ? "Chargement de l'aperçu..."
                  : previewError
                    ? previewError
                    : (preview?.content || "Aucun contenu disponible.")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions footer */}
      <div className="border-t border-[#e5eaf2] px-4 py-3 shrink-0 space-y-2">
        {isPdf && pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded border border-[#071f3d] bg-[#071f3d] px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#0a2d59]"
          >
            <ExternalLink size={13} />
            Voir le PDF
          </a>
        )}
        <div className="flex items-center gap-2">
          {onReindex && (
            <button
              type="button"
              onClick={() => void onReindex()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded border border-[#e5eaf2] bg-white px-3 py-2 text-[11px] font-semibold text-[#071f3d] transition-colors hover:border-[#071f3d] hover:bg-[#f7f9fc]"
            >
              <RefreshCw size={12} />
              Réindexer
            </button>
          )}
          {onDeleteFromIndex && (
            <button
              type="button"
              onClick={() => void onDeleteFromIndex()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded border border-[#f3c6cc] bg-white px-3 py-2 text-[11px] font-semibold text-[#9d0208] transition-colors hover:bg-[#fdf2f3]"
            >
              <Trash2 size={12} />
              Supprimer
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
