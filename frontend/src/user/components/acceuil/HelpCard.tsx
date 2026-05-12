import { CircleHelp, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function HelpCard() {
  return (
    <Link
      to="/user/guide"
      aria-label="Ouvrir le guide utilisateur"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-red-50"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full text-[#b00020]">
        <CircleHelp size={17} strokeWidth={2.3} />
      </span>

      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-800">
          Besoin d’aide ?
        </span>

        <span className="flex items-center gap-1 text-[10px] text-gray-500">
          Voir le guide
          <ChevronRight
            size={12}
            className="text-[#b00020] transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}