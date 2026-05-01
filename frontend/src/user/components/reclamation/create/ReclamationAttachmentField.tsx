import { Paperclip } from "lucide-react";
import type { DragEvent } from "react";
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

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    onChange(event.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div>
      <label className="mb-1 block text-[12px] font-semibold text-slate-700">
        Piece jointe <span className="font-medium text-slate-400">(optionnel)</span>
      </label>

      <label
        className={`${className} flex min-h-12 cursor-pointer items-center justify-center gap-3`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#9d0208]">
          <Paperclip size={14} />
        </span>
        <span className="min-w-0 text-[12px] text-slate-500">
          <span className="block truncate font-semibold text-slate-600">
            {file ? file.name : "Cliquez pour ajouter un fichier ou glissez-deposez ici"}
          </span>
          <span className="block text-[11px] text-slate-400">Formats acceptes : PDF, JPG, PNG, DOC, DOCX (max. 5 Mo)</span>
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
        <div className="mt-2 overflow-hidden rounded-xl border border-[#eadfdb] bg-[#fcf8f7] p-2">
          <img src={previewUrl} alt={file?.name ?? "Apercu"} className="max-h-32 w-full rounded-xl object-cover" />
        </div>
      ) : null}
    </div>
  );
}
