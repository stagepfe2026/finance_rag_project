type AuditHeaderProps = {
  totalActivities: number;
  last24Hours: number;
};

export default function AuditHeader({ totalActivities, last24Hours }: AuditHeaderProps) {
  return (
    <header className="px-3 py-1">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="px-2 text-xl font-bold capitalize tracking-tight text-black">
            Audit <span className="text-red-700">des activités</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-[#eef2f8] px-2 py-0.5 text-[10px] font-semibold text-[#071f3d]">
            {totalActivities} activité{totalActivities !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-[#f5e6e7] px-2 py-0.5 text-[10px] font-semibold text-[#9d0208]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9d0208]" />
            {last24Hours} / 24h
          </span>
        </div>
      </div>
    </header>
  );
}
