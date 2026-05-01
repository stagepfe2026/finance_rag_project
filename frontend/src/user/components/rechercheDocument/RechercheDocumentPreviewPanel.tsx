import { ExternalLink, Heart, X } from "lucide-react";

import {
  documentCategoryLabels,
  type DocumentPreview,
  type DocumentSearchItem,
} from "../../../models/document";

import RechercheDocumentPreviewCard from "./RechercheDocumentPreviewCard";

type Props = {
  item: DocumentSearchItem | null;
  preview: DocumentPreview | null;
  query: string;
  hasActiveSearch: boolean;
  isLoading: boolean;
  error: string;
  apiBaseUrl: string;
  onClose: () => void;
  onToggleFavorite: (item: DocumentSearchItem) => void;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export default function RechercheDocumentPreviewPanel({
  item,
  preview,
  query,
  hasActiveSearch,
  isLoading,
  error,
  apiBaseUrl,
  onClose,
  onToggleFavorite,
}: Props) {
  if (!hasActiveSearch) {
    return null;
  }

  if (!item) {
    return null;
  }

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-xl border border-[#efe3e1] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#273043]">
            Detail document
          </p>
          <h2 className="mt-2 text-[17px] font-semibold leading-7 text-[#273043]">
            {item.title}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#7d6c68]">
            <span className="rounded-full bg-[#fff1f2] px-2.5 py-1 text-[11px] font-medium text-[#9d0208]">
              {documentCategoryLabels[item.category]}
            </span>
            <span>Mis à jour le {formatDate(item.realizedAt || item.createdAt)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite(item)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ead9d6] text-[#9d0208] transition hover:bg-[#fbf3f2]"
            title={item.isFavored ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart size={16} className={item.isFavored ? "fill-current" : ""} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ead9d6] text-[#8d807c] transition hover:bg-[#faf6f5] hover:text-[#9d0208]"
            title="Fermer le detail"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        <div className="rounded-xl bg-[#faf6f5] px-3 py-2.5">
          <p className="text-[#8d807c]">Categorie</p>
          <p className="mt-1 font-medium text-[#2e2928]">{documentCategoryLabels[item.category]}</p>
        </div>
        <div className="rounded-xl bg-[#faf6f5] px-3 py-2.5">
          <p className="text-[#8d807c]">Date realisation</p>
          <p className="mt-1 font-medium text-[#2e2928]">{formatDate(item.realizedAt || item.createdAt)}</p>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-hidden">
        <RechercheDocumentPreviewCard
          preview={preview}
          query={query}
          isLoading={isLoading}
          error={error}
        />
      </div>

      <div className="mt-3 border-t border-[#f1e7e5] pt-3">
        <a
          href={`${apiBaseUrl}/api/v1/document-search/${item.id}/file`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#9d0208] px-4 py-3 text-[13px] font-medium text-white transition hover:bg-[#9d0208]"
        >
          Consulter le document
          <ExternalLink size={14} />
        </a>
      </div>
    </aside>
  );
}
