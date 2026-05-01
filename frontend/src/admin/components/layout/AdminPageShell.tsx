import { useEffect, useState, type ReactNode } from "react";

import AdminSidebar from "./AdminSidebar";

type AdminPageShellProps = {
  children: ReactNode;
  className?: string;
};

export default function AdminPageShell({ children, className = "" }: AdminPageShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem("admin-sidebar-collapsed") === "true");
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("admin-dark-mode") === "true");

  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("admin-dark-mode", String(isDarkMode));
  }, [isDarkMode]);

  return (
    <div className={["admin-theme-root flex h-screen overflow-hidden bg-[#f7f9fc] text-[#071f3d]", isDarkMode ? "admin-dark-theme" : ""].join(" ")}>
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((value) => !value)}
      />
      <main className={["min-w-0 flex-1 overflow-y-auto bg-[#f7f9fc]", className].join(" ")}>{children}</main>
    </div>
  );
}
