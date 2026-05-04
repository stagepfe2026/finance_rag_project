
import {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  FileText,
  Upload,
  MessageSquareWarning,
} from "lucide-react";
import SidebarFooter from "./SidebarFooter";
import SidebarMenu from "./SidebarMenu";
import SidebarHeader from "./SidebarHeader";

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
        "flex h-screen flex-col border-r border-gray-200 bg-white transition-all",
        isCollapsed ? "w-[78px]" : "w-[240px]",
      ].join(" ")}
    >
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggleCollapsed={onToggleCollapsed}
      />

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