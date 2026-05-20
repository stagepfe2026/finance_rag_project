import type { DocumentSearchItem } from "../../../models/document";
import RechercheDocumentResultCard from "./RechercheDocumentResultCard";

type Props = {
  items: DocumentSearchItem[];
  hasActiveSearch: boolean;
  query: string;
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (item: DocumentSearchItem) => void;
  onToggleFavorite: (item: DocumentSearchItem) => void;
};

export default function RechercheDocumentResultsList({
  items,
  hasActiveSearch,
  query,
  selectedId,
  isLoading,
  onSelect,
  onToggleFavorite,
}: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-[13px] text-slate-500">
        Chargement des documents...
      </div>
    );
  }

  if (!hasActiveSearch) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-500">
        Lancez une recherche ou utilisez les filtres pour afficher les documents juridiques et financiers.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-[13px] text-slate-500">
        Aucun document trouvé.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <RechercheDocumentResultCard
          key={item.id}
          item={item}
          query={query}
          isSelected={item.id === selectedId}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
