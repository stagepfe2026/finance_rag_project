import { Paperclip } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = useMemo(() => Boolean(file?.type.startsWith("image/")), [file]);

  useEffect(() => {
    if (!file || !isImage) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, isImage]);

  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
        Piece jointe
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

      {previewUrl ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-[#eadfdb] bg-[#fcf8f7] p-2">
          <img src={previewUrl} alt={file?.name ?? "Apercu"} className="max-h-52 w-full rounded-xl object-cover" />
        </div>
      ) : null}
    </div>
  );
}
