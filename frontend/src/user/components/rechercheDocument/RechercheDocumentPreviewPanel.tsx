import { ExternalLink, Heart } from "lucide-react";

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
  isLoading: boolean;
  error: string;
  apiBaseUrl: string;
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
  isLoading,
  error,
  apiBaseUrl,
  onToggleFavorite,
}: Props) {
  if (!item) {
    return (
      <aside className="rounded-2xl border border-[#efe3e1] bg-white p-5 text-[13px] text-[#7d6c68] shadow-sm">
        Sélectionnez un document pour afficher son contenu.
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-[#efe3e1] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold leading-7 text-[#221f1e]">
            {item.title}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#7d6c68]">
            <span className="rounded-full bg-[#f6efee] px-2.5 py-1 text-[11px] font-medium text-[#7b322b]">
              {documentCategoryLabels[item.category]}
            </span>
            <span>Mis à jour le {formatDate(item.realizedAt || item.createdAt)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleFavorite(item)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ead9d6] text-[#b2342c] transition hover:bg-[#fbf3f2]"
          title={item.isFavored ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart size={16} className={item.isFavored ? "fill-current" : ""} />
        </button>
      </div>

      <RechercheDocumentPreviewCard
        preview={preview}
        query={query}
        isLoading={isLoading}
        error={error}
      />

      <a
        href={`${apiBaseUrl}/api/v1/document-search/${item.id}/file`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#b2342c] px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#8f2923]"
      >
        Voir le document complet
        <ExternalLink size={14} />
      </a>
    </aside>
  );
}