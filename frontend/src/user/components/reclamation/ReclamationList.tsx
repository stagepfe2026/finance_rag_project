import type { Reclamation } from "../../../models/reclamation";
import ReclamationStatusBadge from "./ReclamationStatusBadge";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type ReclamationListProps = {
  reclamations: Reclamation[];
  search: string;
  onSearchChange: (value: string) => void;
};

export default function ReclamationList({ reclamations, search, onSearchChange }: ReclamationListProps) {
  return (
    <section className="rounded-[28px] border border-[#eee3e0] bg-white p-5 shadow-[0_20px_60px_rgba(155,114,108,0.08)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[16px] font-semibold text-[#cf3d4c]">Liste des reclamations</h1>
          <p className="mt-1 text-sm text-slate-500">Retrouvez vos reclamations et leur statut.</p>
        </div>
        <div className="w-full sm:w-[280px]">
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Rechercher par ticket ou sujet"
            className="w-full rounded-xl border border-[#e8ddda] bg-[#fcfaf9] px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#cf3d4c]"
          />
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#f0e7e4]">
        <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr] gap-3 bg-[#faf6f5] px-4 py-3 text-[12px] font-medium text-slate-500 md:grid">
          <span>Sujet</span>
          <span>Ticket</span>
          <span>Date</span>
          <span>Statut</span>
        </div>

        {reclamations.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">Aucune reclamation trouvee.</div>
        ) : null}

        <div className="divide-y divide-[#f1e9e6]">
          {reclamations.map((reclamation) => (
            <div key={reclamation._id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr] md:items-center">
              <div>
                <p className="text-sm font-medium text-slate-800">{reclamation.subject}</p>
                <p className="mt-1 text-xs text-slate-500">{reclamation.problemType === "AUTRE" ? reclamation.customProblemType : reclamation.problemType}</p>
              </div>
              <div className="text-sm text-slate-600">{reclamation.ticketNumber}</div>
              <div className="text-sm text-slate-600">{formatDate(reclamation.createdAt)}</div>
              <div>
                <ReclamationStatusBadge status={reclamation.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
