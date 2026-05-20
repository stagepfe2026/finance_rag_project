import type { Reclamation } from "../../../../models/reclamation";
import ReclamationDetailsPanel from "./ReclamationDetailsPanel";

type Props = {
  reclamation: Reclamation | null;
  open: boolean;
  onClose: () => void;
};

export default function ReclamationDetailsModal({ reclamation, open, onClose }: Props) {
  if (!open || !reclamation) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/35 px-4 py-4">
      <div className="w-full max-w-2xl">
        <ReclamationDetailsPanel reclamation={reclamation} onClose={onClose} />
      </div>
    </div>
  );
}
