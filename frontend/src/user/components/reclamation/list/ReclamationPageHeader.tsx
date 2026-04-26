type Props = {
  total: number;
};

export default function ReclamationPageHeader({ total }: Props) {
  return (
    <div className="px-6 pb-2 pt-6">
      <div className="flex items-center gap-3">
        <h1 className="text-[18px] font-bold leading-none text-[#2f2b2a]">
          Mes reclamations
        </h1>
        <span className="rounded-[10px] bg-[#f3efee] px-2.5 py-1 text-[12px] font-semibold text-[#8b5e58]">
          {total}
        </span>
      </div>
      <p className="mt-2 text-[13px] text-slate-500">
        Consultez votre liste de reclamations et suivez l evolution de vos demandes.
      </p>
    </div>
  );
}
