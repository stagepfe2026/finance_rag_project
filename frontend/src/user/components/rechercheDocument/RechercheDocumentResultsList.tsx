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
      <div className="rounded-xl bg-white p-5 text-[13px] text-[#7d6c68]">
        Chargement des documents...
      </div>
    );
  }

  if (!hasActiveSearch) {
    return (
      <div className="rounded-xl border border-dashed border-[#efe3e1] bg-[#fcfaf9] p-5 text-[13px] text-[#7d6c68]">
        Faire des recherches dans les documents juridique et  financiers  pour afficher les resultats.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-white p-5 text-[13px] text-[#7d6c68]">
        Aucun document trouvé.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
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
