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
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
        Priorité <span className="text-[#cf3d4c]">*</span>
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      >
        <option value="">Sélectionnez une priorité</option>
        <option value="LOW">Basse</option>
        <option value="NORMAL">Normale</option>
        <option value="HIGH">Haute</option>
      </select>

      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}