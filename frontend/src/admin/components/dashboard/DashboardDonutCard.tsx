import { ChartPie } from "lucide-react";

type DonutItem = {
  label: string;
  value: number;
  color: string;
  tone: string;
};

type DashboardDonutCardProps = {
  title: string;
  items: DonutItem[];
};

export default function DashboardDonutCard({ title, items }: DashboardDonutCardProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const chartTotal = Math.max(total, 1);
  const segments =
    total === 0
      ? ["#e9eef6 0deg 360deg"]
      : items.reduce<{ currentAngle: number; segments: string[] }>(
          (accumulator, item) => {
            const angle = (item.value / chartTotal) * 360;
            const segment = `${item.color} ${accumulator.currentAngle}deg ${accumulator.currentAngle + angle}deg`;
            return {
              currentAngle: accumulator.currentAngle + angle,
              segments: [...accumulator.segments, segment],
            };
          },
          { currentAngle: -90, segments: [] },
        ).segments;

  return (
    <div className="rounded-lg border border-[#e0e6f0] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#6c7894]">Repartition</p>
          <h2 className="mt-1 text-[19px] font-bold text-[#071f3d]">{title}</h2>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff0f2] text-[#9d0208]">
          <ChartPie size={17} />
        </span>
      </div>

      <div className="mt-5 flex items-center gap-5 max-sm:flex-col max-sm:items-start">
        <div
          className="h-36 w-36 shrink-0 rounded-full"
          style={{
            background: `conic-gradient(${segments.join(", ")})`,
          }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full border-[12px] border-transparent">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-center shadow-inner">
              <div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#6c7894]">Total</p>
                <p className="mt-1 text-xl font-bold text-[#071f3d]">{total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3 max-sm:w-full">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-[#e0e6f0] bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.tone }} />
                <span className="text-sm font-semibold text-[#071f3d]">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-[#071f3d]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
