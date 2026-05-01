import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquareWarning,
  Moon,
  Shield,
  Sun,
  Upload,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../../auth/AuthContext";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
  { label: "Avis chat", icon: BarChart3, to: "/admin/avis-chat" },
  { label: "Audit", icon: ClipboardList, to: "/admin/audit" },
  { label: "Documents", icon: FileText, to: "/admin/documents/list" },
  { label: "Import Document", icon: Upload, to: "/admin/documents/import" },
  { label: "Reclamations", icon: MessageSquareWarning, to: "/admin/reclamations" },
];

type AdminSidebarProps = {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
};

export default function AdminSidebar({
  isCollapsed,
  onToggleCollapsed,
  isDarkMode,
  onToggleDarkMode,
}: AdminSidebarProps) {
  const { logout, user } = useAuth();
  const adminInitial = (user?.prenom?.[0] ?? user?.nom?.[0] ?? "A").toUpperCase();

  return (
    <aside
      className={[
        "admin-sidebar relative flex h-screen shrink-0 flex-col overflow-hidden border-r border-[#e2e7f0] bg-[#fcfdff] px-3 py-4 shadow-[8px_0_28px_rgba(7,31,61,0.05)] transition-[width] duration-300",
        isCollapsed ? "w-[78px]" : "w-[226px]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="absolute right-3 top-5 z-10 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#e2e7f0] bg-white text-[#6c7894] shadow-sm transition hover:border-[#9d0208] hover:text-[#9d0208]"
        aria-label={isCollapsed ? "Ouvrir la sidebar" : "Fermer la sidebar"}
        title={isCollapsed ? "Ouvrir la sidebar" : "Fermer la sidebar"}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className={["mb-6 flex min-h-[44px] items-center", isCollapsed ? "justify-center" : "gap-3 pr-9"].join(" ")}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071f3d] text-white shadow-[0_10px_20px_rgba(7,31,61,0.18)]">
          <Shield size={21} />
        </div>
        {!isCollapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-[#071f3d]">Ministere</p>
            <p className="mt-0.5 truncate text-[11px] font-medium text-[#6c7894]">Administration</p>
          </div>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "admin-sidebar-link flex h-11 w-full items-center rounded-xl text-left text-[12px] font-semibold transition",
                      isCollapsed ? "justify-center px-0" : "gap-3 px-3",
                      isActive
                        ? "bg-[linear-gradient(90deg,#9d0208_0%,#7a0106_100%)] text-white shadow-[0_10px_20px_rgba(157,2,8,0.18)]"
                        : "text-[#071f3d] hover:bg-[#fff0f3] hover:text-[#9d0208]",
                    ].join(" ")
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={17} strokeWidth={2} />
                  {!isCollapsed ? (
                    <span className="truncate">{item.label}</span>
                  ) : null}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-4 border-t border-[#e2e7f0] pt-4">
        <button
          type="button"
          onClick={onToggleDarkMode}
          className={[
            "mb-3 flex h-10 w-full cursor-pointer items-center rounded-xl text-[12px] font-semibold text-[#5f6680] transition hover:bg-[#f4f7fb] hover:text-[#9d0208]",
            isCollapsed ? "justify-center px-0" : "gap-2 px-3",
          ].join(" ")}
          title={isDarkMode ? "Mode clair" : "Mode sombre"}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          {!isCollapsed ? <span>{isDarkMode ? "Mode clair" : "Mode sombre"}</span> : null}
        </button>

        <div className={["flex items-center", isCollapsed ? "justify-center" : "gap-2.5"].join(" ")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9d0208] text-[11px] font-bold text-white">
            {adminInitial}
          </div>
          {!isCollapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-[#071f3d]">
                {user?.prenom} {user?.nom}
              </p>
              <p className="truncate text-[9px] text-[#6c7894]">{user?.email}</p>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className={[
            "mt-4 flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-[#e2e7f0] bg-white text-[11px] font-semibold text-[#5f6680] transition hover:border-[#9d0208] hover:text-[#9d0208]",
            isCollapsed ? "px-0" : "gap-2 px-3",
          ].join(" ")}
          title="Deconnexion"
        >
          <LogOut size={14} />
          {!isCollapsed ? "Deconnexion" : null}
        </button>
      </div>
    </aside>
  );
}
