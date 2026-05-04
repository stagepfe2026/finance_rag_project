import { useState } from "react";
import AdminSidebar from "../components/sidebar/AdminSidebar";
import { Outlet } from "react-router-dom";


export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);

  return (
    <div
      className={[
        "grid h-screen transition-all",
        dark ? "bg-gray-900 text-white" : "bg-gray-50 text-[#071f3d]",
      ].join(" ")}
      style={{
        gridTemplateColumns: collapsed ? "78px 1fr" : "225px 1fr",
      }}
    >
      <AdminSidebar
        isCollapsed={collapsed}
        isDarkMode={dark}
        onToggleCollapsed={() => setCollapsed(!collapsed)}
        onToggleDarkMode={() => setDark(!dark)}
      />

      <main className="overflow-auto p-4"><Outlet /></main>
    </div>
  );
}
