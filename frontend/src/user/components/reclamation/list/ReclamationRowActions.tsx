import { Eye, Pencil, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";

type Props = {
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function ReclamationRowActions({ onView, onEdit, onDelete }: Props) {
  function handleActionClick(event: MouseEvent<HTMLButtonElement>, action?: () => void) {
    event.stopPropagation();
    action?.();
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={(event) => handleActionClick(event, onView)}
        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-[#9d0208] hover:text-[#273043]"
        title="Consulter"
      >
        <Eye size={14} />
      </button>

      {onEdit ? (
        <button
          type="button"
          onClick={(event) => handleActionClick(event, onEdit)}
          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-[#9d0208] hover:text-[#273043]"
          title="Modifier"
        >
          <Pencil size={14} />
        </button>
      ) : null}

      <button
        type="button"
        onClick={(event) => handleActionClick(event, onDelete)}
        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-[#f0caca] hover:text-rose-600"
        title="Supprimer"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
