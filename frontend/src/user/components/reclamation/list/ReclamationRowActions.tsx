import { Eye, Trash2 } from "lucide-react";

type Props = {
  onView: () => void;
  onDelete?: () => void;
};

export default function ReclamationRowActions({ onView, onDelete }: Props) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={onView}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#ece4e1] bg-white text-[#8b817d] transition hover:border-[#d8cbc7] hover:text-[#7b312b]"
        title="Consulter"
      >
        <Eye size={14} />
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#ece4e1] bg-white text-[#8b817d] transition hover:border-[#f0caca] hover:text-rose-600"
        title="Supprimer"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
