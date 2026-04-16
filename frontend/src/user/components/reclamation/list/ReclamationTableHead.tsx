export default function ReclamationTableHead() {
  return (
    <div className="grid grid-cols-[2.4fr_1fr_1.3fr_1.3fr_0.7fr] gap-4 border-t border-b border-[#f0e8e5] px-6 py-3 text-[13px] font-semibold text-slate-700">
      <span>Sujet</span>
      <span>Statut</span>
      <span>Date de création</span>
      <span>Dernière mise à jour</span>
      <span className="text-center">Actions</span>
    </div>
  );
}