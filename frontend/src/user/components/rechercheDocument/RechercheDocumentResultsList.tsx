import type { DocumentSearchItem } from "../../../models/document";
import RechercheDocumentResultCard from "./RechercheDocumentResultCard";

type Props = {
  items: DocumentSearchItem[];
  query: string;
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (item: DocumentSearchItem) => void;
  onToggleFavorite: (item: DocumentSearchItem) => void;
};

export default function RechercheDocumentResultsList({
  items,
  query,
  selectedId,
  isLoading,
  onSelect,
  onToggleFavorite,
}: Props) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-6 text-[13px] text-[#7d6c68]">
        Chargement des documents...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 text-[13px] text-[#7d6c68]">
        Aucun document trouvé.
      </div>
    );
  }

  return (
    <div className="space-y-3">
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