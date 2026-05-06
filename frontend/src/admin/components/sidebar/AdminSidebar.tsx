import {
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageSquareWarning,
  Upload,
} from "lucide-react";
import SidebarFooter from "./SidebarFooter";
import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";

const menuItems = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Avis chat", to: "/admin/avis-chat", icon: BarChart3 },
  { label: "Audit", to: "/admin/audit", icon: ClipboardList },
  { label: "Documents", to: "/admin/documents/list", icon: FileText },
  { label: "Import", to: "/admin/documents/import", icon: Upload },
  { label: "Réclamations", to: "/admin/reclamations", icon: MessageSquareWarning },
];

type Props = {
  isCollapsed: boolean;
  isDarkMode: boolean;
  onToggleCollapsed: () => void;
  onToggleDarkMode: () => void;
};

export default function AdminSidebar({
  isCollapsed,
  isDarkMode,
  onToggleCollapsed,
  onToggleDarkMode,
}: Props) {
  return (
    <aside
      className={[
        "admin-sidebar flex h-screen flex-col border-r border-[#e5eaf2] bg-white transition-all duration-300",
        isCollapsed ? "w-[78px]" : "w-[240px]",
      ].join(" ")}
    >
      <SidebarHeader isCollapsed={isCollapsed} isDarkMode={isDarkMode} onToggleCollapsed={onToggleCollapsed} />
      <div className="flex-1 overflow-y-auto px-2">
        <SidebarMenu items={menuItems} isCollapsed={isCollapsed} />
      </div>
      <SidebarFooter
        isCollapsed={isCollapsed}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
      />
    </aside>
  );
}
