import {
  LayoutDashboard,
  FileText,
  Upload,
  
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Documents", icon: FileText },
  { label: "Import Document", icon: Upload, active: true },

];

export default function AdminSidebar() {
  return (
    <aside className="flex h-screen w-[210px] shrink-1 flex-col border-r border-[#ede7e5] bg-[#fbf8f7]">
      <div className="flex items-center gap-2.5 border-b border-[#ede7e5] px-4 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c81e1e] text-white shadow-sm">
          <span className="text-[18px] font-bold">⚖</span>
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
                <button
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[12px] transition ${
                    item.active
                      ? "bg-[#cf2027] text-white shadow-sm"
                      : "text-[#44403f] hover:bg-white"
                  }`}
                >
                  <Icon size={14} strokeWidth={2} />
                  <span className="truncate font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[#ede7e5] px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#cf2027] text-[11px] font-semibold text-white">
            A
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-[#111111]">Admin</p>
            <p className="truncate text-[9px] text-[#8b8482]">
              administrateur@ministere.tn
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
