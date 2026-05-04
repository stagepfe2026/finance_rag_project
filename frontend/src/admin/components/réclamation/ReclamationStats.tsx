type ReclamationStatsProps = {
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    urgent: number;
  };
};

export default function ReclamationStats({ stats }: ReclamationStatsProps) {
  const cards = [
    ["Total", stats.total, "Journal complet"],
    ["En attente", stats.pending, "A traiter"],
    ["En cours", stats.inProgress, "Reponse ouverte"],
    ["Traitees", stats.resolved, "Cloturees"],
    ["Urgentes", stats.urgent, "Prioritaires"],
  ] as const;

  return (
    <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-5">
      {cards.map(([label, value, sub]) => (
        <div key={label} className="rounded-lg border border-[#e5eaf2] bg-white p-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-red-700">
            {label}
          </p>
          <p className="mt-1 text-lg font-bold leading-none text-[#071f3d]">{value}</p>
          <p className="mt-1 truncate text-xs text-[#5f6680]">{sub}</p>
        </div>
      ))}
    </div>
  );
}
