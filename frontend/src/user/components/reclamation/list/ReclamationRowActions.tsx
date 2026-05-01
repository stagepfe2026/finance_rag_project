import { Eye, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";

type Props = {
  onView: () => void;
  onDelete?: () => void;
};

export default function ReclamationRowActions({ onView, onDelete }: Props) {
  function handleActionClick(event: MouseEvent<HTMLButtonElement>, action?: () => void) {
    event.stopPropagation();
    action?.();
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={(event) => handleActionClick(event, onView)}
        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-[#ece4e1] bg-white text-[#8b817d] transition hover:border-[#d8cbc7] hover:text-[#7b312b]"
        title="Consulter"
      >
        <Eye size={14} />
      </button>

      <button
        type="button"
        onClick={(event) => handleActionClick(event, onDelete)}
        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-[#ece4e1] bg-white text-[#8b817d] transition hover:border-[#f0caca] hover:text-rose-600"
        title="Supprimer"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
