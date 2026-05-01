import { Activity, Download, FileText, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";

import type { AuditStats } from "../../../models/audit";

function StatsCard({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-[#eadfdd] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#a08f8c]">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff3f2] text-[#9d0208]">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 text-[28px] font-semibold tracking-tight text-[#211f1f]">{value}</p>
    </div>
  );
}

export default function AuditStatsGrid({ stats }: { stats: AuditStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <StatsCard label="Total activites" value={stats.total} icon={Activity} />
      <StatsCard label="Utilisateurs" value={stats.uniqueUsers} icon={UserRound} />
      <StatsCard label="Auth" value={stats.authActivities} icon={ShieldCheck} />
      <StatsCard label="Reclamations" value={stats.reclamationActivities} icon={FileText} />
      <StatsCard label="Dernieres 24h" value={stats.last24Hours} icon={Download} />
    </div>
  );
}
