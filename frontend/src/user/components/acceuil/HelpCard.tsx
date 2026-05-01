import { CircleHelp } from "lucide-react";
import { Link } from "react-router-dom";

export default function HelpCard() {
  return (
    <Link
      to="/user/guide"
      aria-label="Ouvrir le guide utilisateur"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-[#273043] p-2 pr-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1f2636]"
    >
      <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#9d0208]">
        <span className="absolute inset-0 rounded-full bg-[#9d0208]/10 opacity-0 transition group-hover:scale-125 group-hover:opacity-100" />
        <CircleHelp size={22} className="relative" />
      </span>
      <span className="leading-tight">
        <span className="block text-[12px] font-bold">Besoin d aide ?</span>
        <span className="block text-[11px] text-slate-200">Voir le guide</span>
      </span>
    </Link>
  );
}
