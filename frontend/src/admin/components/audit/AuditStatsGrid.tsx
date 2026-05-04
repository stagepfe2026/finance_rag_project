import type { AuditStats } from "../../../models/audit";

function StatsCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded border border-[#e5eaf2] rounded-lg bg-white p-2">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-red-700">{label}</p>
        <p className="mt-1 text-lg font-bold leading-none tracking-tight text-[#071f3d]">{value}</p>
        <p className="mt-1 truncate text-xs text-[#5f6680]">{sub}</p>
      </div>
    </div>
  );
}

export default function AuditStatsGrid({ stats }: { stats: AuditStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-7">
      <StatsCard label="Total activites" value={stats.total} sub="Journal filtre" />
      <StatsCard label="Utilisateurs" value={stats.uniqueUsers} sub="Acteurs uniques" />
      <StatsCard label="Authentification" value={stats.authActivities} sub="Connexions et sessions" />
      <StatsCard label="Reclamations" value={stats.reclamationActivities} sub="Actions metier" />
      <StatsCard label="Chat" value={stats.chatActivities} sub="Conversations et avis" />
      <StatsCard label="Documents" value={stats.documentSearchActivities} sub="Recherche et consultation" />
      <StatsCard label="Dernieres 24h" value={stats.last24Hours} sub="Activite recente" />
    </div>
  );
}
