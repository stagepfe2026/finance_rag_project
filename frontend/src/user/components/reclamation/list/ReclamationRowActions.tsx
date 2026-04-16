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
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#e8ddd9] bg-[#faf7f6] text-slate-500 transition hover:text-[#cf3d4c]"
        title="Consulter"
      >
        <Eye size={14} />
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#e8ddd9] bg-[#faf7f6] text-slate-500 transition hover:text-rose-600"
        title="Supprimer"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}