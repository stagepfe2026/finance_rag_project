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
      onClick={() => onSelect(item)}
      className={[
        "cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition",
        isSelected
          ? "border-[#9d0208] bg-red-50/20 shadow-[0_8px_20px_rgba(157,2,8,0.08)]"
          : "border-slate-200 hover:border-[#9d0208]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          aria-label={`Selectionner le document ${item.title}`}
          onClick={() => onSelect(item)}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="text-[14px] font-semibold leading-5 text-[#273043]">
            <RechercheDocumentHighlightText text={item.title} query={query} />
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-[#9d0208]">
              {documentCategoryLabels[item.category]}
            </span>
            <span>{formatDate(item.realizedAt || item.createdAt)}</span>
          </div>
        </button>

        <button
          type="button"
          aria-label={item.isFavored ? `Retirer ${item.title} des favoris` : `Ajouter ${item.title} aux favoris`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(item);
          }}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-[#9d0208] transition hover:bg-red-50"
          title={item.isFavored ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart size={15} className={item.isFavored ? "fill-current" : ""} />
        </button>
      </div>

      <div className="mt-2 space-y-1 text-[12px] leading-5 text-slate-600">
        {item.snippets.length > 0 ? (
          item.snippets.slice(0, 2).map((snippet: string, index: number) => (
            <p key={`${item.id}-${index}`} className="line-clamp-3">
              <RechercheDocumentHighlightText text={snippet} query={query} />
            </p>
          ))
        ) : (
          <p className="line-clamp-3">Aucun extrait disponible.</p>
        )}
      </div>
    </article>
  );
}
