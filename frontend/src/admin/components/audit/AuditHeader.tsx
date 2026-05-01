export default function AuditHeader() {
  return (
    <header className="bg-[#f7f9fc] px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-[#273043]">
            Audit <span className="text-[#9d0208]">des activites</span>
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] text-[#5f6680]">
            Suivi des actions utilisateurs, detail au clic, export filtre par utilisateur et historique pagine.
          </p>
        </div>
      </div>
    </header>
  );
}
