import type { ChangeEvent, DragEvent } from "react";

type UploadZoneProps = {
  file: File | null;
  isBusy: boolean;
  onFileSelect: (file: File | null) => void;
};

export default function UploadZone({ file, isBusy, onFileSelect }: UploadZoneProps) {
  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    onFileSelect(nextFile);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const nextFile = event.dataTransfer.files?.[0] ?? null;
    onFileSelect(nextFile);
  }

  return (
    <div className="rounded-lg border border-[#e5eaf2] bg-white">
      <div className="border-b border-[#e5eaf2] px-4 py-2">
        <h2 className="text-sm font-bold text-[#071f3d]">Fichier</h2>
      </div>

      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="m-4 flex min-h-[116px] cursor-pointer flex-col items-center justify-center rounded border border-dashed border-[#e5eaf2] bg-[#f7f9fc] px-6 text-center transition hover:border-[#071f3d]"
      >
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleInputChange}
          disabled={isBusy}
        />

        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded bg-[#9d0208] text-white shadow-sm">
          <span className="text-[14px]">↑</span>
        </div>

        {file ? (
          <div>
            <p className="text-[12px] font-semibold text-[#071f3d]">{file.name}</p>
            <p className="mt-1 text-[11px] text-[#5f6680]">
              Cliquez pour remplacer le document sélectionné.
            </p>
          </div>
        ) : (
          <p className="text-[12px] text-[#5f6680]">
            Drag & drop your document here or <span className="font-semibold text-[#9d0208]">Choose File</span>
          </p>
        )}
      </label>
    </div>
  );
}
