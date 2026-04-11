import { FileText, X } from "lucide-react";
import { documentCategoryLabels, type DocumentPreview } from "../../../models/document";

type DocumentPreviewAsideProps = {
  preview: DocumentPreview;
  isLoading: boolean;
  error: string;
  onClose: () => void;
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export default function DocumentPreviewAside({ preview, isLoading, error, onClose }: DocumentPreviewAsideProps) {
  return (
    <aside className="w-full rounded-2xl border border-[#ede7e5] bg-white xl:w-[360px] xl:min-w-[360px]">
      <div className="flex items-start justify-between border-b border-[#ede7e5] bg-[#fbf8f7] px-4 py-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a7472]">Apercu Word</p>
          <h2 className="text-[15px] font-semibold text-[#111111]">{preview.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-[#7a7472] hover:bg-[#f5efed] hover:text-[#111111]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <div className="rounded-xl bg-[#f8f4f2] px-3 py-2">
            <p className="text-[#7a7472]">Categorie</p>
            <p className="mt-1 font-medium text-[#111111]">{documentCategoryLabels[preview.category]}</p>
          </div>
          <div className="rounded-xl bg-[#f8f4f2] px-3 py-2">
            <p className="text-[#7a7472]">Date</p>
            <p className="mt-1 font-medium text-[#111111]">{formatDate(preview.createdAt)}</p>
          </div>
        </div>

        {preview.description ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a7472]">Description</p>
            <p className="mt-1 text-[12px] leading-5 text-[#7a7472]">{preview.description}</p>
          </div>
        ) : null}

        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#7a7472]">
            <FileText size={14} />
            Contenu
          </div>
          <div className="mt-2 max-h-[520px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#ede7e5] bg-[#fffdfc] px-3 py-3 text-[12px] leading-6 text-[#3f3a39]">
            {isLoading ? "Chargement de l apercu..." : error ? error : preview.content}
          </div>
        </div>
      </div>
    </aside>
  );
}
