export default function ReclamationTableHead() {
  return (
    <div className="grid grid-cols-[1.15fr_2.2fr_1fr_1.2fr_1.2fr_0.8fr] gap-4 border-y border-[#ece4e1] bg-[#faf7f6] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a817d]">
      <span>Ticket</span>
      <span>Sujet</span>
      <span>Statut</span>
      <span>Creation</span>
      <span>Mise a jour</span>
      <span className="text-center">Actions</span>
    </div>
  );
}
