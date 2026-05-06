import { useEffect, useState } from "react";
import AdminSidebar from "../components/sidebar/AdminSidebar";
import { Outlet } from "react-router-dom";

const ADMIN_THEME_KEY = "admin-layout-theme";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ADMIN_THEME_KEY) === "dark";
  });

  useEffect(() => {
    window.localStorage.setItem(ADMIN_THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  return (
    <div
      className={[
        "admin-theme-root grid h-screen",
        dark ? "admin-dark-theme" : "",
        collapsed ? "admin-sidebar-collapsed" : "admin-sidebar-expanded",
      ].filter(Boolean).join(" ")}
      style={{
        gridTemplateColumns: collapsed ? "78px 1fr" : "225px 1fr",
      }}
    >
      <AdminSidebar
        isCollapsed={collapsed}
        isDarkMode={dark}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onToggleDarkMode={() => setDark((d) => !d)}
      />
      <main className="overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
