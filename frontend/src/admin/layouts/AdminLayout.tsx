import { Outlet } from "react-router-dom";
import AccessibilityMenu from "../../components/accessibility/AccessibilityMenu";
import { useAdminLayoutViewModel } from "../viewmodels/useAdminLayoutViewModel";
import AdminSidebar from "../components/sidebar/AdminSidebar";
import Snackbar from "../components/Snackbar";

const ADMIN_HIGH_CONTRAST_KEY = "admin-layout-high-contrast";

export default function AdminLayout() {
  const vm = useAdminLayoutViewModel();

  return (
    <div
      className={[
        "admin-theme-root grid h-screen",
        vm.dark ? "admin-dark-theme" : "",
        vm.collapsed ? "admin-sidebar-collapsed" : "admin-sidebar-expanded",
      ].filter(Boolean).join(" ")}
      style={{ gridTemplateColumns: vm.collapsed ? "78px 1fr" : "225px 1fr" }}
    >
      <AdminSidebar
        isCollapsed={vm.collapsed}
        isDarkMode={vm.dark}
        onToggleCollapsed={() => vm.setCollapsed((c) => !c)}
        onToggleDarkMode={() => vm.setDark((d) => !d)}
      />
      <main className="overflow-auto p-4">
        <Outlet />
      </main>

      <AccessibilityMenu
        highContrastClassName="admin-high-contrast"
        highContrastStorageKey={ADMIN_HIGH_CONTRAST_KEY}
        isDarkMode={vm.dark}
      />

      <Snackbar
        open={vm.reminderOpen}
        message={vm.reminderMessage}
        tone="info"
        duration={6000}
        onClose={vm.handleCloseReminder}
      />
    </div>
  );
}
