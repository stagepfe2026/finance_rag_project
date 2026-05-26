import type { AuditStats } from "../../../models/audit";

function StatsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-[#e5eaf2] rounded-lg bg-white p-2">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-red-700">{label}</p>
        <p className="mt-1 text-lg font-bold leading-none tracking-tight text-[#071f3d]">{value}</p>
      </div>
    </div>
  );
}

export default function AuditStatsGrid({ stats }: { stats: AuditStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      <StatsCard label="Connexions" value={stats.authActivities} />
      <StatsCard label="Réclamations" value={stats.reclamationActivities} />
      <StatsCard label="Conversations" value={stats.chatActivities} />
      <StatsCard label="Consultations" value={stats.documentSearchActivities} />
      <StatsCard label="Activité récente" value={stats.last24Hours} />
    </div>
  );
}
