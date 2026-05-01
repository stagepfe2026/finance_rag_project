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
    <div className="min-w-0 overflow-hidden rounded-lg border border-[#e0e6f0] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#6c7894]">Repartition</p>
          <h2 className="mt-1 text-[19px] font-bold text-[#071f3d]">{title}</h2>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff0f2] text-[#9d0208]">
          <ChartPie size={17} />
        </span>
      </div>

      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[132px_minmax(0,1fr)]">
        <div
          className="h-32 w-32 shrink-0 rounded-full shadow-[0_18px_34px_rgba(7,31,61,0.08)]"
          style={{
            background: `conic-gradient(${segments.join(", ")})`,
          }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full border-[12px] border-transparent">
            <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-white text-center shadow-inner">
              <div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#6c7894]">Total</p>
                <p className="mt-1 text-xl font-bold text-[#071f3d]">{total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-[#e0e6f0] bg-[#f7f9fd] px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.tone }} />
                <span className="truncate text-sm font-semibold text-[#071f3d]">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-[#071f3d]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
