import { AlertTriangle, FileBarChart2, ShieldAlert, Users, type LucideIcon } from "lucide-react";

import type { AdminDashboardSummary } from "../../../models/admin-dashboard";

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-[#e0e6f0] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-[#f3c6cc] hover:shadow-[0_18px_34px_rgba(7,31,61,0.08)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fff0f2] text-[#9d0208]">
          <Icon size={19} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#6c7894]">{title}</p>
          <p className="mt-1 text-[24px] font-bold leading-none tracking-tight text-[#071f3d]">{value}</p>
          <p className="mt-1 truncate text-[12px] text-[#5f6680]">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardSummaryCards({ summary }: { summary: AdminDashboardSummary }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="Documents indexes"
        value={summary.documentsIndexed}
        subtitle={`${summary.documentsTotal} documents au total`}
        icon={FileBarChart2}
      />
      <SummaryCard
        title="Reclamations"
        value={summary.reclamationsTotal}
        subtitle={`${summary.pendingReclamations} en attente`}
        icon={ShieldAlert}
      />
      <SummaryCard title="Cas urgents" value={summary.reclamationsUrgent} subtitle="A prioriser rapidement" icon={AlertTriangle} />
      <SummaryCard title="Derniers acces" value={summary.activeUsers} subtitle="Utilisateurs actifs recents" icon={Users} />
    </div>
  );
}
