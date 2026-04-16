import { List, SendHorizontal, X } from "lucide-react";

type Props = {
  isSubmitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
  onOpenList: () => void;
};

export default function ReclamationFormActions({
  isSubmitting,
  onSubmit,
  onClose,
  onOpenList,
}: Props) {
  return (
    <div className="flex flex-col gap-3 border-t border-[#f0e8e5] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onOpenList}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e2d8d5] bg-[#faf7f6] px-4 py-2.5 text-[13px] font-medium text-slate-700 transition hover:border-[#cfc0bb]"
      >
        <List size={14} />
        Consulter la liste des réclamations
      </button>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e2d8d5] bg-[#faf7f6] px-4 py-2.5 text-[13px] font-medium text-slate-700 transition hover:border-[#cfc0bb]"
        >
          <X size={14} />
          Fermer
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#cf3d4c] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#b93442] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <SendHorizontal size={14} />
          {isSubmitting ? "Envoi..." : "Soumettre la réclamation"}
        </button>
      </div>
    </div>
  );
}