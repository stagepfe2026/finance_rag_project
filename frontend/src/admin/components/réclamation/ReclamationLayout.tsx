import type { ReactNode } from "react";
import ReclamationStats from "./ReclamationStats";

type ReclamationLayoutProps = {
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    urgent: number;
  };
  children: ReactNode;
};

export default function ReclamationLayout({
  stats,
  children,
}: ReclamationLayoutProps) {
  return (
    <div className="admin-reclamation-page min-h-screen bg-[#f7f9fc]">
      <header className="admin-reclamation-header px-3 py-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="admin-reclamation-title px-2 text-xl font-bold capitalize tracking-tight text-black">
            Reclamations <span className="text-red-700">admin</span>
          </h1>

          <div className="flex items-center gap-2">
            <span className="admin-reclamation-count-badge inline-flex items-center gap-1 rounded bg-[#eef2f8] px-2 py-0.5 text-[10px] font-semibold text-[#071f3d]">
              {stats.total} total
            </span>
            <span className="admin-reclamation-urgent-badge inline-flex items-center gap-1 rounded bg-[#f5e6e7] px-2 py-0.5 text-[10px] font-semibold text-[#9d0208]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9d0208]" />
              {stats.urgent} urgente{stats.urgent !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <ReclamationStats stats={stats} />
      </header>

      <main className="px-2 py-1">{children}</main>
    </div>
  );
}
