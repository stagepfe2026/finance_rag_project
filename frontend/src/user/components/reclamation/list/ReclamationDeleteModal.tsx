import type { Reclamation } from "../../../../models/reclamation";

type Props = {
  reclamation: Reclamation | null;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ReclamationDeleteModal({
  reclamation,
  open,
  busy,
  onClose,
  onConfirm,
}: Props) {
  if (!open || !reclamation) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-800">
          Supprimer cette reclamation ?
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          Voulez-vous vraiment supprimer la reclamation <span className="font-medium text-slate-800">{reclamation.subject}</span> ?
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Ticket: {reclamation.ticketNumber}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-[#eadfdb] bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-[#d8c8c3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-xl bg-[#9d0208] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9d0208] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}
