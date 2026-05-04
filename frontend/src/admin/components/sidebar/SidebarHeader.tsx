import { ChevronLeft, ChevronRight } from "lucide-react";
import cimfLogo from "../../../assets/cimf-logo.png";
import cimfLogoSmall from "../../../assets/cimf-logo-small.png";
type Props = {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
};

export default function SidebarHeader({
  isCollapsed,
  onToggleCollapsed,
}: Props) {
  return (
    <div className="relative flex items-center border-b border-gray-100 p-3">
      {/* toggle button */}
      <button
        onClick={onToggleCollapsed}
        className="absolute right-2 h-8 w-8 flex items-center cursor-pointer justify-center rounded-md border border-gray-200 hover:bg-gray-100"
      >
        {isCollapsed ? (
          <ChevronRight size={16} />
        ) : (
          <ChevronLeft size={16} />
        )}
      </button>

      <div className="flex items-center gap-3">
        {/* Expanded → IMAGE only */}
        {!isCollapsed && (
          <img
            src={cimfLogo}
            className="h-9 w-full"
            alt="CIMF"
          />
        )}

        {/* Collapsed → TEXT only */}
        {isCollapsed && (
          <img
            src={cimfLogoSmall}
            className="h-6 w-full"
            alt="CIMF"
          />
        )}
      </div>
    </div>
  );
}