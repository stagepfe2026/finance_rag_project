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
      <div className={["flex items-center", isCollapsed ? "flex-col gap-2" : "justify-between"].join(" ")}>
        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          aria-label={isDarkMode ? "Activer le mode clair" : "Activer le mode sombre"}
          className={[
            "flex h-8 items-center rounded-md text-[11px] font-medium cursor-pointer transition-all duration-200",
            isCollapsed ? "justify-center w-8" : "gap-1.5 px-2",
            "text-[#5f6680] hover:bg-[#f7f9fc] hover:text-[#071f3d]",
          ].join(" ")}
        >
          {isDarkMode ? (
            <Sun size={14} className="text-[#9d0208]" />
          ) : (
            <Moon size={14} />
          )}
          {!isCollapsed && (isDarkMode ? "Mode clair" : "Mode sombre")}
        </button>

        {/* Notifications bell */}
        <AdminNotificationsBell isCollapsed={isCollapsed} />

        {/* Logout */}
        <button
          type="button"
          onClick={() => void logout()}
          className={[
            "flex h-8 items-center rounded-md text-[11px] font-medium cursor-pointer transition-all duration-200",
            "text-[#9d0208] hover:bg-[#f5e6e7]",
            isCollapsed ? "justify-center w-8" : "gap-1.5 px-2",
          ].join(" ")}
        >
          <LogOut size={14} />
          {!isCollapsed && "Déconnexion"}
        </button>
      </div>
    </div>
  );
}
