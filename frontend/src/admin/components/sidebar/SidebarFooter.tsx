import { LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "../../../auth/AuthContext";
import AdminNotificationsBell from "../notifications/AdminNotificationsBell";

type Props = {
  isCollapsed: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
};

export default function SidebarFooter({ isCollapsed, isDarkMode, onToggleDarkMode }: Props) {
  const { logout, user } = useAuth();
  const darkModeLabel = isDarkMode ? "Mode clair" : "Mode sombre";
  const footerTooltipPosition = isCollapsed
    ? "left-full top-1/2 ml-3 -translate-y-1/2"
    : "bottom-full left-1/2 mb-2 -translate-x-1/2";

  return (
    <div className="border-t border-[#e5eaf2] p-3 space-y-3">
      {/* User profile */}
      <div className={["flex items-center", isCollapsed ? "justify-center" : "gap-2"].join(" ")}>
        <div className="h-8 w-8 shrink-0">
          <img
            src={user?.profileImageUrl}
            alt={user?.prenom}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-[#e5eaf2]"
          />
        </div>
        {!isCollapsed && (
          <div className="text-xs leading-tight min-w-0">
            <p className="font-semibold text-[#071f3d] truncate">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-[#8a96ad] truncate max-w-[120px]">{user?.email}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={["flex items-center", isCollapsed ? "flex-col gap-2" : "justify-center gap-3"].join(" ")}>
        {/* Dark mode toggle */}
        <div className="group relative">
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkModeLabel}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-md cursor-pointer transition-all duration-200",
              "text-[#5f6680] hover:bg-[#f7f9fc] hover:text-[#071f3d]",
            ].join(" ")}
          >
            {isDarkMode ? (
              <Sun size={14} className="text-[#9d0208]" />
            ) : (
              <Moon size={14} />
            )}
          </button>
          <span className={`pointer-events-none absolute z-50 whitespace-nowrap rounded border border-[#e5eaf2] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#071f3d] opacity-0 shadow-lg transition group-hover:opacity-100 ${footerTooltipPosition}`}>
            {darkModeLabel}
          </span>
        </div>

        {/* Notifications bell */}
        <AdminNotificationsBell tooltipPosition={footerTooltipPosition} />

        {/* Logout */}
        <div className="group relative">
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Deconnexion"
            className={[
              "flex h-9 w-9 items-center justify-center rounded-md cursor-pointer transition-all duration-200",
              "text-[#9d0208] hover:bg-[#f5e6e7]",
            ].join(" ")}
          >
            <LogOut size={14} />
          </button>
          <span className={`pointer-events-none absolute z-50 whitespace-nowrap rounded border border-[#e5eaf2] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#071f3d] opacity-0 shadow-lg transition group-hover:opacity-100 ${footerTooltipPosition}`}>
            Deconnexion
          </span>
        </div>
      </div>
    </div>
  );
}
