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
    <div className="rounded-l border border-[#ede7e5] p-4 shadow-[0_10px_35px_rgba(87,51,39,0.04)]">
      <h2 className="mb-3 text-[13px] font-semibold text-[#111111]">Upload File</h2>

      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="flex min-h-[116px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#e4dedd] bg-[#fcfbfb] px-6 text-center"
      >
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleInputChange}
          disabled={isBusy}
        />

        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-[#cf2027] text-white shadow-sm">
          <span className="text-[14px]">↑</span>
        </div>

        {file ? (
          <div>
            <p className="text-[12px] font-medium text-[#111111]">{file.name}</p>
            <p className="mt-1 text-[11px] text-[#6f6968]">
              Cliquez pour remplacer le document sélectionné.
            </p>
          </div>
        ) : (
          <p className="text-[12px] text-[#6f6968]">
            Drag & drop your document here or <span className="font-semibold text-[#cf2027]">Choose File</span>
          </p>
        )}
      </label>
    </div>
  );
}
