type Props = {
  total: number;
};

export default function ReclamationPageHeader({ total }: Props) {
  return (
    <div className="shrink-0 px-6 pb-2 pt-4">
      <div className="flex items-center gap-3">
        <h1 className="text-[18px] font-bold leading-none text-[#273043]">
          Mes reclamations
        </h1>
        <span className="rounded-xl bg-[#eef1ff] px-2.5 py-1 text-[12px] font-semibold text-[#273043]">
          {total}
        </span>
      </div>
      <p className="mt-1.5 text-[12px] text-slate-500">
        Consultez votre liste de reclamations et suivez l evolution de vos demandes.
      </p>
    </div>
  );
}
