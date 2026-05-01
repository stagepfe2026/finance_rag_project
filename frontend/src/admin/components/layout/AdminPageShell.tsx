import { useEffect, useState, type ReactNode } from "react";

import AdminSidebar from "./AdminSidebar";

type AdminPageShellProps = {
  children: ReactNode;
  className?: string;
};

export default function AdminPageShell({ children, className = "" }: AdminPageShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem("admin-sidebar-collapsed") === "true");
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("admin-dark-mode") === "true");
  const sidebarWidth = isSidebarCollapsed ? "78px" : "226px";

  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("admin-dark-mode", String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const resize = () => window.dispatchEvent(new Event("resize"));
    resize();
    const firstFrame = window.requestAnimationFrame(resize);
    const transitionFrame = window.setTimeout(resize, 340);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(transitionFrame);
    };
  }, [isSidebarCollapsed]);

  return (
    <div
      className={[
        "admin-theme-root grid h-screen overflow-hidden bg-[#f7f9fc] text-[#071f3d] transition-[grid-template-columns] duration-300",
        isSidebarCollapsed ? "admin-sidebar-collapsed" : "admin-sidebar-expanded",
        isDarkMode ? "admin-dark-theme" : "",
      ].join(" ")}
      style={{ gridTemplateColumns: `${sidebarWidth} minmax(0, 1fr)` }}
    >
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((value) => !value)}
      />
      <main className={["min-w-0 overflow-x-hidden overflow-y-auto bg-[#f7f9fc]", className].join(" ")}>{children}</main>
    </div>
  );
}
