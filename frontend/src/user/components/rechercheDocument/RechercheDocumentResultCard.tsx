import { Heart } from "lucide-react";

import {
  documentCategoryLabels,
  type DocumentSearchItem,
} from "../../../models/document";

import RechercheDocumentHighlightText from "./RechercheDocumentHighlightText";

type Props = {
  item: DocumentSearchItem;
  query: string;
  isSelected: boolean;
  onSelect: (item: DocumentSearchItem) => void;
  onToggleFavorite: (item: DocumentSearchItem) => void;
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

export default function RechercheDocumentResultCard({
  item,
  query,
  isSelected,
  onSelect,
  onToggleFavorite,
}: Props) {
  return (
    <article
      className={[
        "rounded-2xl border bg-white p-4 shadow-sm transition",
        isSelected
          ? "border-[#d76a62] shadow-[0_8px_24px_rgba(178,52,44,0.08)]"
          : "border-[#efe3e1] hover:border-[#d8b5b0]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onSelect(item)}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="text-[16px] font-semibold leading-6 text-[#221f1e]">
            <RechercheDocumentHighlightText text={item.title} query={query} />
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#7d6c68]">
            <span className="rounded-full bg-[#f6efee] px-2.5 py-1 text-[11px] font-medium text-[#7b322b]">
              {documentCategoryLabels[item.category]}
            </span>
            <span>{formatDate(item.realizedAt || item.createdAt)}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onToggleFavorite(item)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ead9d6] text-[#b2342c] transition hover:bg-[#fbf3f2]"
          title={item.isFavored ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart size={15} className={item.isFavored ? "fill-current" : ""} />
        </button>
      </div>

      <div className="mt-3 space-y-2 text-[13px] leading-6 text-[#49403e]">
        {item.snippets.length > 0 ? (
          item.snippets.slice(0, 2).map((snippet: string, index: number) => (
            <p key={`${item.id}-${index}`} className="line-clamp-4">
              <RechercheDocumentHighlightText text={snippet} query={query} />
            </p>
          ))
        ) : (
          <p className="line-clamp-3">{item.description || "Aucun extrait disponible."}</p>
        )}
      </div>
    </article>
  );
}