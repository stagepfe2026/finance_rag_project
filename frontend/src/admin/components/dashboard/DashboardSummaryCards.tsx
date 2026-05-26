import type { AdminDashboardSummary } from "../../../models/admin-dashboard";

type CardProps = {
  label: string;
  value: number;
};

function SummaryCard({ label, value }: CardProps) {
  return (
    <div className="rounded border border-[#e5eaf2] rounded-lg bg-white p-2 flex items-start">
      

      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.05em] font-semibold text-red-700">{label}</p>
        <p className="mt-1 text-lg font-bold leading-none tracking-tight text-[#071f3d]">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardSummaryCards({ summary }: { summary: AdminDashboardSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <SummaryCard label="Base documentaire" value={summary.documentsIndexed} />
      <SummaryCard label="Réclamations totales" value={summary.reclamationsTotal} />
      <SummaryCard label="Réclamations urgentes" value={summary.reclamationsUrgent} />
      <SummaryCard label="Utilisateurs enregistrés" value={summary.activeUsers} />
    </div>
  );
}
