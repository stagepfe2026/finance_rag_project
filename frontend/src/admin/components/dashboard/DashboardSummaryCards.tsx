import type { AdminDashboardSummary } from "../../../models/admin-dashboard";

type CardProps = {
  label: string;
  value: number;
  sub: string;
};

function SummaryCard({ label, value, sub }: CardProps) {
  return (
    <div className="rounded border border-[#e5eaf2] rounded-lg bg-white p-2 flex items-start">
      

      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.05em] font-semibold text-red-700">{label}</p>
        <p className="mt-1 text-lg font-bold leading-none tracking-tight text-[#071f3d]">{value}</p>
        <p className="mt-1 text-xs text-[#5f6680] truncate">{sub}</p>
      </div>
    </div>
  );
}

export default function DashboardSummaryCards({ summary }: { summary: AdminDashboardSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <SummaryCard
        label="Documents indexés"
        value={summary.documentsIndexed}
        sub={`${summary.documentsTotal} au total`}
      />
      <SummaryCard
        label="Réclamations"
        value={summary.reclamationsTotal}
        sub={`${summary.pendingReclamations} en attente`}
      />
      <SummaryCard
        label="Cas urgents"
        value={summary.reclamationsUrgent}
        sub="À prioriser"
        
      />
      <SummaryCard
        label="Utilisateurs actifs"
        value={summary.activeUsers}
        sub="Derniers accès"
        />
    </div>
  );
}
