type Props = {
  total: number;
};

export default function ReclamationPageHeader({ total }: Props) {
  return (
    <div className="shrink-0 border-b border-slate-200 px-4 py-3">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold leading-none text-[#273043]">
          Mes reclamations
        </h1>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-[#273043]">
          {total}
        </span>
      </div>
      <p className="mt-1 text-[12px] text-slate-500">
        Consultez votre liste de reclamations et suivez l evolution de vos demandes.
      </p>
    </div>
  );
}
