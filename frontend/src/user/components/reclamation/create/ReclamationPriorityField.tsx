import type { ReclamationPriority } from "../../../../models/reclamation";

type Props = {
  value: ReclamationPriority | "";
  error?: string;
  onChange: (value: string) => void;
  className: string;
};

export default function ReclamationPriorityField({
  value,
  error,
  onChange,
  className,
}: Props) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-semibold text-slate-700">
        Priorite <span className="text-[#9d0208]">*</span>
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      >
        <option value="">Selectionnez une priorite</option>
        <option value="LOW">Basse</option>
        <option value="NORMAL">Normale</option>
        <option value="HIGH">Haute</option>
        <option value="URGENT">Urgente</option>
      </select>

      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
