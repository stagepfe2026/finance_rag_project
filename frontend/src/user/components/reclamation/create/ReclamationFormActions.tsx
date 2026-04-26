import { SendHorizontal } from "lucide-react";

type Props = {
  isSubmitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
  onOpenList: () => void;
};

export default function ReclamationFormActions({
  isSubmitting,
  onSubmit,
}: Props) {
  return (
    <div className="flex justify-end border-t border-[#f0e8e5] pt-4">
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#cf3d4c] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#b93442] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <SendHorizontal size={14} />
        {isSubmitting ? "Envoi..." : "Soumettre la reclamation"}
      </button>
    </div>
  );
}
