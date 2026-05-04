type DonutItem = { label: string; value: number; color: string };

type Props = { title: string; items: DonutItem[] };

export default function DashboardDonutCard({ title, items }: Props) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const chartTotal = Math.max(total, 1);

  // handle zero + single value cases
  const nonZeroItems = items.filter(i => i.value > 0);

  const segments =
    total === 0
      ? ["#e5eaf2 0deg 360deg"]
      : nonZeroItems.length === 1
      ? [`${nonZeroItems[0].color} 0deg 360deg`]
      : items.reduce<{ angle: number; acc: string[] }>(
          ({ angle, acc }, item) => {
            const deg = (item.value / chartTotal) * 360;
            return {
              angle: angle + deg,
              acc: [...acc, `${item.color} ${angle}deg ${angle + deg}deg`],
            };
          },
          { angle: -90, acc: [] }
        ).acc;

  return (
    <div className="rounded-lg border border-[#e5eaf2] bg-white">
      {/* Header */}
      <div className="border-b border-[#e5eaf2] px-4 py-2">
        <h2 className="text-sm font-bold text-[#071f3d]">{title}</h2>
      </div>

      {/* Body */}
      <div className="flex items-center gap-5 px-4 py-4">
        {/* Donut */}
        <div className="shrink-0">
          <div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: 96,
              height: 96,
              background: `conic-gradient(${segments.join(", ")})`,
            }}
          >
            {/* Inner circle (controls thickness) */}
            <div
              className="absolute flex items-center justify-center rounded-full bg-[#f8fafc] border border-[#e5eaf2]"
              style={{
                width: "90%",   // 🔥 smaller = thicker donut
                height: "90%",
              }}
            >
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-[0.1em] text-[#8a96ad] font-semibold">
                  Total
                </p>
                <p className="mt-0.5 text-sm font-bold leading-none text-[#071f3d]">
                  {total}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {items.map(item => {
            const pct = total === 0 ? 0 : Math.round((item.value / total) * 100);

            return (
              <div
                key={item.label}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-[11px] font-medium text-[#071f3d]">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#8a96ad]">
                    {pct}%
                  </span>
                  <span className="w-7 text-right text-[11px] font-bold text-[#071f3d]">
                    {item.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}