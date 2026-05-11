import type { ChatFeedbackStats } from "../../../models/chat-feedback";
import { useAdminDarkMode } from "../../hooks/useAdminDarkMode";

const NAVY = "#071f3d";
const RED = "#9d0208";
const GRAY = "#6b7280";
const DARK_NAVY = "#93c5fd";
const DARK_RED = "#f87171";
const DARK_GRAY = "#cbd5e1";

type QualityItem = {
  label: string;
  value: number;
  color: string;
};

function buildSegments(items: QualityItem[], emptyColor: string) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const chartTotal = Math.max(total, 1);
  const nonZeroItems = items.filter((item) => item.value > 0);

  if (total === 0) {
    return [`${emptyColor} 0deg 360deg`];
  }

  if (nonZeroItems.length === 1) {
    return [`${nonZeroItems[0].color} 0deg 360deg`];
  }

  return items.reduce<{ angle: number; acc: string[] }>(
    ({ angle, acc }, item) => {
      const deg = (item.value / chartTotal) * 360;
      return {
        angle: angle + deg,
        acc: [...acc, `${item.color} ${angle}deg ${angle + deg}deg`],
      };
    },
    { angle: -90, acc: [] },
  ).acc;
}

export default function QualityCard({ quality }: { quality: ChatFeedbackStats["quality"] }) {
  const isDark = useAdminDarkMode();
  const items: QualityItem[] = [
    { label: "Likes", value: quality.likes, color: isDark ? DARK_NAVY : NAVY },
    { label: "Dislikes", value: quality.dislikes, color: isDark ? DARK_RED : RED },
    { label: "Sans source", value: quality.dislikesWithoutSource ?? 0, color: isDark ? DARK_GRAY : GRAY },
  ];
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const segments = buildSegments(items, isDark ? "#334155" : "#e5eaf2");

  return (
    <section className="rounded-lg border border-[#e5eaf2] bg-white">
      <div className="border-b border-[#e5eaf2] px-4 py-2">
        <h2 className="text-sm font-bold text-[#071f3d]">Qualité des réponses</h2>
      </div>

      <div className="flex items-center gap-5 px-4 py-4">
        <div className="shrink-0">
          <div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: 96,
              height: 96,
              background: `conic-gradient(${segments.join(", ")})`,
            }}
          >
            <div
              className="absolute flex items-center justify-center rounded-full border border-[#e5eaf2] bg-[#f8fafc]"
              style={{ width: "90%", height: "90%" }}
            >
              <div className="text-center">
                <p className="text-sm font-bold leading-none text-[#071f3d]">{quality.satisfactionRate}%</p>
                <p className={isDark ? "mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#cbd5e1]" : "mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8a96ad]"}>
                  Satisfaction
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {items.map((item) => {
            const pct = total === 0 ? 0 : Math.round((item.value / total) * 100);

            return (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-[11px] font-medium text-[#071f3d]">{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={isDark ? "text-[11px] text-[#cbd5e1]" : "text-[11px] text-[#8a96ad]"}>{pct}%</span>
                  <span className="w-7 text-right text-[11px] font-bold text-[#071f3d]">{item.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
