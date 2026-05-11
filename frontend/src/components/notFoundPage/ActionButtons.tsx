import { ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";

type ActionButtonsProps = {
  homePath: string;
  homeLabel: string;
  onBack: () => void;
};

export default function ActionButtons({ homePath, homeLabel, onBack }: ActionButtonsProps) {
  return (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex cursor-pointer h-11 min-w-[190px] items-center justify-center gap-2 rounded border border-[#9aa3af] bg-white px-4 text-[11px] font-semibold text-[#1f2937] transition hover:border-[#071f3d] hover:bg-[#f7f9fc]"
      >
        <ArrowLeft size={14} />
        Retour a la page precedente
      </button>
      <Link
        to={homePath}
        className="inline-flex cursor-pointer h-11 min-w-[150px] items-center justify-center gap-2 rounded bg-[#d4001a] px-4 text-[11px] font-semibold text-white transition hover:bg-[#b80016]"
      >
        <Home size={14} />
        {homeLabel}
      </Link>
    </div>
  );
}
