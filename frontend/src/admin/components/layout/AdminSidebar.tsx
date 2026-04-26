import { ClipboardList, FileText, LayoutDashboard, LogOut, MessageSquareWarning, Upload } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../../auth/AuthContext";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
  { label: "Audit", icon: ClipboardList, to: "/admin/audit" },
  { label: "Documents", icon: FileText, to: "/admin/documents/list" },
  { label: "Import Document", icon: Upload, to: "/admin/documents/import" },
  { label: "Reclamations", icon: MessageSquareWarning, to: "/admin/reclamations" },
];

export default function AdminSidebar() {
  const { logout, user } = useAuth();

  return (
    <aside className="sticky top-0 flex h-screen w-[210px] shrink-0 flex-col border-r border-[#ede7e5] bg-[#fbf8f7]">
      <div className="flex items-center gap-2.5 border-b border-[#ede7e5] px-4 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c81e1e] text-white shadow-sm">
          <span className="text-[18px] font-bold">A</span>
        </div>
        <div>
          <h1 className="text-[12px] font-semibold leading-none text-[#111111]">Ministère</h1>
          <p className="mt-1 text-[10px] text-[#86807e]">Administration</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5">
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[12px] transition ${
                      isActive ? "bg-[#cf2027] text-white shadow-sm" : "text-[#44403f] hover:bg-white"
                    }`
                  }
                >
                  <Icon size={14} strokeWidth={2} />
                  <span className="truncate font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[#ede7e5] px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#cf2027] text-[11px] font-semibold text-white">
            {(user?.prenom?.[0] ?? user?.nom?.[0] ?? "A").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-[#111111]">{user?.prenom} {user?.nom}</p>
            <p className="truncate text-[9px] text-[#8b8482]">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="mt-4 flex w-full items-center justify-center gap-2 cursor-pointer rounded-lg border border-[#e5d9d7] bg-white px-3 py-2 text-[11px] font-semibold text-[#5b5755] transition hover:border-[#cf2027] hover:text-[#cf2027]"
        >
          <LogOut size={13} />
          Deconnexion
        </button>
      </div>
    </aside>
  );
}
