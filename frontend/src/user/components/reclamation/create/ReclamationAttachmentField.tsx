import { Paperclip } from "lucide-react";

type Props = {
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
  className: string;
};

export default function ReclamationAttachmentField({
  file,
  error,
  onChange,
  className,
}: Props) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
        Pièce jointe
      </label>

      <label className={`${className} flex cursor-pointer items-center gap-2`}>
        <Paperclip size={14} className="shrink-0 text-slate-400" />
        <span className="truncate text-[13px] text-slate-500">
          {file ? file.name : "Aucun fichier choisi"}
        </span>
        <input
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>

      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}