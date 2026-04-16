import type { Reclamation } from "../../../../models/reclamation";
import ReclamationTableRow from "./ReclamationTableRow";

type Props = {
  reclamations: Reclamation[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (reclamation: Reclamation) => void;
  onDelete: (reclamation: Reclamation) => void;
};

export default function ReclamationTableBody({
  reclamations,
  selectedId,
  isLoading,
  onSelect,
  onDelete,
}: Props) {
  if (reclamations.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-slate-500">
        {isLoading ? "Chargement des reclamations..." : "Aucune reclamation trouvee."}
      </div>
    );
  }

  return (
    <div>
      {reclamations.map((reclamation) => (
        <ReclamationTableRow
          key={reclamation._id}
          reclamation={reclamation}
          active={selectedId === reclamation._id}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
