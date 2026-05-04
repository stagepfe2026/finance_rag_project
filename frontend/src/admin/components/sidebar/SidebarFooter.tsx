import { LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "../../../auth/AuthContext";

type Props = {
  isCollapsed: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
};

export default function SidebarFooter({
  isCollapsed,
  isDarkMode,
  onToggleDarkMode,
}: Props) {
  const { logout, user } = useAuth();

  return (
    <div className="border-t border-gray-200 p-3 space-y-4">
      {/* USER */}
      <div
        className={[
          "flex items-center",
          isCollapsed ? "justify-center" : "gap-2",
        ].join(" ")}
      >
        <div className="h-8 w-8 shrink-0">
          <img
            src={user?.profileImageUrl}
            alt={user?.prenom}
            className="h-8 w-8 rounded-full object-cover"
          />
        </div>

        {!isCollapsed && (
          <div className="text-xs leading-tight">
            <p className="font-medium">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-gray-500 truncate max-w-[120px]">
              {user?.email}
            </p>
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div
        className={[
          "flex items-center",
          isCollapsed ? "flex-col gap-2" : "justify-between gap-2",
        ].join(" ")}
      >
        {/* DARK MODE */}
        <button
          onClick={onToggleDarkMode}
          className={[
            "flex h-9 items-center rounded-md text-xs cursor-pointer hover:bg-gray-100 transition",
            isCollapsed ? "justify-center w-9" : "gap-2 px-3",
          ].join(" ")}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={14} />}
          {!isCollapsed && "Mode"}
        </button>

        {/* LOGOUT */}
        <button
          onClick={() => logout()}
          className={[
            "flex h-9 items-center rounded-md text-xs cursor-pointer text-gray-600 hover:text-red-600 hover:bg-gray-100 transition",
            isCollapsed ? "justify-center w-9" : "gap-2 px-3",
          ].join(" ")}
        >
          <LogOut size={14} />
          {!isCollapsed && "Déconnexion"}
        </button>
      </div>
    </div>
  );
}
