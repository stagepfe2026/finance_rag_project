export default function ReclamationTableHead() {
  return (
    <div className="grid shrink-0 grid-cols-[1.1fr_2.3fr_0.9fr_1fr_1fr_0.75fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
      <span>Ticket</span>
      <span>Sujet</span>
      <span>Statut</span>
      <span>Creation</span>
      <span>Mise a jour</span>
      <span className="text-center">Actions</span>
    </div>
  );
}
