import type { ReactNode } from "react";

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper: string;
};

export default function StatCard({ label, value, helper }: StatCardProps) {
  const valueClassName =
    typeof value === "string" && value.length > 18
      ? "mt-1 truncate text-sm font-bold text-[#071f3d]"
      : "mt-1 text-lg font-bold leading-none tracking-tight text-[#071f3d]";

  return (
    <article className="rounded border border-[#e5eaf2] rounded-lg bg-white p-2">
      <div className="flex min-w-0 items-start gap-2">
      
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-red-700">{label}</p>
          <p className={valueClassName}>{value}</p>
          <p className="mt-1 truncate text-xs text-[#5f6680]">{helper}</p>
        </div>
      </div>
    </article>
  );
}
