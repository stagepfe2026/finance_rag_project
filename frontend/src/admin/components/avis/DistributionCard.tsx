import type { ChatFeedbackDistributionItem } from "../../../models/chat-feedback";
import { useAdminDarkMode } from "../../hooks/useAdminDarkMode";

const COLORS = ["#071f3d", "#9d0208", "#f06f80", "#8d7f83", "#d995a0"];
const DARK_COLORS = ["#93c5fd", "#f87171", "#fb7185", "#cbd5e1", "#fbbf24"];

function buildDistributionGradient(items: ChatFeedbackDistributionItem[], colors: string[], emptyColor: string) {
  if (items.length === 0) {
    return `${emptyColor} 0deg 360deg`;
  }

  const nonZeroItems = items.filter((item) => item.count > 0);
  if (nonZeroItems.length === 1) {
    const index = items.indexOf(nonZeroItems[0]);
    return `${colors[index % colors.length]} 0deg 360deg`;
  }

  let start = -90;
  const segments = items.map((item, index) => {
    const end = start + (item.percentage / 100) * 360;
    const segment = `${colors[index % colors.length]} ${start}deg ${end}deg`;
    start = end;
    return segment;
  });

  return segments.join(", ");
}

type DistributionCardProps = {
  distribution: ChatFeedbackDistributionItem[];
  total: number;
  selectedName: string;
  onSelectedNameChange: (name: string) => void;
};

export default function DistributionCard({
  distribution,
  total,
  selectedName,
  onSelectedNameChange,
}: DistributionCardProps) {
  const isDark = useAdminDarkMode();
  const colors = isDark ? DARK_COLORS : COLORS;
  const selectedItem = distribution.find((item) => item.documentName === selectedName) ?? distribution[0] ?? null;

  return (
    <section className="rounded-lg border border-[#e5eaf2] bg-white">
      <div className="border-b border-[#e5eaf2] px-4 py-2">
        <h2 className="text-sm font-bold text-[#071f3d]">Répartition des signalements</h2>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            <div
              className="relative flex items-center justify-center rounded-full"
              style={{
                width: 96,
                height: 96,
                background: `conic-gradient(${buildDistributionGradient(distribution, colors, isDark ? "#334155" : "#e5eaf2")})`,
              }}
            >
              <div
                className="absolute flex items-center justify-center rounded-full border border-[#e5eaf2] bg-[#f8fafc]"
                style={{ width: "90%", height: "90%" }}
              >
                <div className="text-center">
                  <p className={isDark ? "text-[9px] font-semibold uppercase tracking-[0.1em] text-[#cbd5e1]" : "text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8a96ad]"}>Total</p>
                  <p className="mt-0.5 text-sm font-bold leading-none text-[#071f3d]">{total}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            {distribution.length === 0 ? (
              <p className="text-[12px] text-[#8a96ad]">Aucun document signalé.</p>
            ) : (
              distribution.map((item, index) => (
                <button
                  key={`${item.documentName}-${index}`}
                  type="button"
                  onClick={() => onSelectedNameChange(item.documentName)}
                  className={[
                    "flex w-full cursor-pointer items-center justify-between gap-2 text-left transition-colors",
                    selectedItem?.documentName === item.documentName ? "text-[#071f3d]" : "text-[#071f3d]",
                  ].join(" ")}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="truncate text-[11px] font-medium">{item.documentName}</span>
                  </span>

                  <span className="flex shrink-0 items-center gap-2">
                    <span className={isDark ? "text-[11px] text-[#cbd5e1]" : "text-[11px] text-[#8a96ad]"}>{item.percentage}%</span>
                    <span className="w-7 text-right text-[11px] font-bold text-[#071f3d]">{item.count}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
{/* 
        {selectedItem ? (
          <div className="mt-4 rounded border border-[#e5eaf2] bg-[#f7f9fc] p-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a96ad]">Document sélectionné</p>
            <p className="mt-1 truncate text-sm font-bold text-[#071f3d]">{selectedItem.documentName}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
              <span className="rounded bg-white px-1 py-1 text-[#071f3d]">
                <strong className="block text-base">{selectedDocument?.likes ?? 0}</strong>
                Likes
              </span>
              <span className="rounded bg-white px-1 py-1 text-[#9d0208]">
                <strong className="block text-base">{selectedDocument?.dislikes ?? selectedItem.count}</strong>
                Dislikes
              </span>
              <span className="rounded bg-white px-1 py-1 text-[#071f3d]">
                <strong className="block text-base">{selectedDocument?.reportRate ?? selectedItem.percentage}%</strong>
                Taux
              </span>
            </div>
            {selectedDocument?.documentId ? (
              <button
                type="button"
                disabled={busyDocumentId === selectedDocument.documentId}
                onClick={() => onReindex(selectedDocument)}
                className="mt-3 cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded border border-[#e5eaf2] bg-white px-3 py-2 text-[11px] font-bold text-[#071f3d] transition-colors hover:border-[#071f3d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={busyDocumentId === selectedDocument.documentId ? "animate-spin" : ""}
                />
                Réindexer ce document
              </button>
            ) : null}
          </div>
        ) : null} */}
      </div>
    </section>
  );
}
