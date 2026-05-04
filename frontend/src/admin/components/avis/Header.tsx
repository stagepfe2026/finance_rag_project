import { Calendar, RefreshCw } from "lucide-react";

type HeaderProps = {
  reportedResponsesCount: number;
  documentSignalementsCount: number;
  onRefresh: () => void;
  isLoading: boolean;
};

export default function Header({
  reportedResponsesCount,
  documentSignalementsCount,
  onRefresh,
  isLoading,
}: HeaderProps) {
  return (
    <header className="px-3 py-1">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="px-2 text-xl font-bold capitalize tracking-tight text-black">
            Avis <span className="text-red-700">chat</span>
          </h1>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded border border-[#e5eaf2] bg-white px-3 text-[11px] font-semibold text-[#071f3d] transition-colors hover:border-[#8a96ad] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <RefreshCw size={12} className="animate-spin" /> : <Calendar size={12} />}
            7 derniers jours
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-[#f5e6e7] px-2 py-0.5 text-[10px] font-semibold text-[#9d0208]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9d0208]" />
              {reportedResponsesCount} réponse{reportedResponsesCount !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-[#eef2f8] px-2 py-0.5 text-[10px] font-semibold text-[#071f3d]">
              {documentSignalementsCount} signalement{documentSignalementsCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
