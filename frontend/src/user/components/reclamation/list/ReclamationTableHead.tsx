export default function ReclamationTableHead() {
  return (
    <div className="grid shrink-0 grid-cols-[1.15fr_2.25fr_0.95fr_1.1fr_1.1fr_0.75fr] gap-4 border-y border-[#ece4e1] bg-white px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a817d]">
      <span>Ticket</span>
      <span>Sujet</span>
      <span>Statut</span>
      <span>Creation</span>
      <span>Mise a jour</span>
      <span className="text-center">Actions</span>
    </div>
  );
}
