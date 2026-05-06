import { ChevronLeft, ChevronRight } from "lucide-react";
import cimfLogo from "../../../assets/cimf-logo.png";
import cimfLogoSmall from "../../../assets/cimf-logo-small.png";
import cimfLogoWhite from "../../../assets/cimf-logo-white.png";

type Props = {
  isCollapsed: boolean;
  isDarkMode: boolean;
  onToggleCollapsed: () => void;
};

export default function SidebarHeader({ isCollapsed, isDarkMode, onToggleCollapsed }: Props) {
  return (
    <div className="relative flex items-center border-b border-[#e5eaf2] p-3">
      <button
        onClick={onToggleCollapsed}
        className="absolute right-1 flex h-6 w-5 cursor-pointer items-center justify-center rounded-md border border-[#e5eaf2] hover:bg-[#f7f9fc]"
        aria-label={isCollapsed ? "Développer le menu" : "Réduire le menu"}
      >
        {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      <div className="flex items-center gap-3">
        {!isCollapsed && (
          <img
            src={isDarkMode ? cimfLogoWhite : cimfLogo}
            className="h-9 w-full"
            alt="CIMF"
          />
        )}
        {isCollapsed && (
          <img src={cimfLogoSmall} className="h-6 w-full" alt="CIMF" />
        )}
      </div>
    </div>
  );
}
