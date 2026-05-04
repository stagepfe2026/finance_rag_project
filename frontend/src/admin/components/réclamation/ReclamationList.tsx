import type { Reclamation } from "../../../models/reclamation";
import ReclamationListRow from "./ReclamationListRow";

type ReclamationListProps = {
  items: Reclamation[];
  selectedId: string | null;
  showPanel: boolean;
  isLoading: boolean;
  onSelect: (reclamation: Reclamation) => void;
};

export default function ReclamationList({
  items,
  selectedId,
  showPanel,
  isLoading,
  onSelect,
}: ReclamationListProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead className="sticky top-0 z-10 bg-[#f7f9fc]">
          <tr className="text-left text-[10px] font-semibold uppercase text-red-700">
            <th className="border-b border-[#e5eaf2] px-4 py-2.5">Ticket</th>
            <th className="border-b border-[#e5eaf2] px-4 py-2.5">Sujet</th>
            <th className="border-b border-[#e5eaf2] px-4 py-2.5">Utilisateur</th>
            <th className="border-b border-[#e5eaf2] px-4 py-2.5">Priorite</th>
            <th className="border-b border-[#e5eaf2] px-4 py-2.5">Statut</th>
            <th className="border-b border-[#e5eaf2] px-4 py-2.5">Date</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-sm text-[#8a96ad]">
                Chargement des reclamations...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-sm text-[#8a96ad]">
                Aucune reclamation trouvee.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <ReclamationListRow
                key={item._id}
                item={item}
                isSelected={selectedId === item._id && showPanel}
                onSelect={onSelect}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
