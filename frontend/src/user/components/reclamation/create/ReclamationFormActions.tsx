import { SendHorizontal } from "lucide-react";

type Props = {
  isSubmitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
};

export default function ReclamationFormActions({
  isSubmitting,
  onSubmit,
  onClose,
}: Props) {
  return (
    <div className="flex justify-end gap-3 border-t border-[#f0e8e5] pt-3">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-[12px] font-semibold text-[#273043] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        Annuler
      </button>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#9d0208] px-4 text-[12px] font-semibold text-white transition hover:bg-[#870106] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <SendHorizontal size={14} />
        {isSubmitting ? "Envoi..." : "Soumettre la reclamation"}
      </button>
    </div>
  );
}
