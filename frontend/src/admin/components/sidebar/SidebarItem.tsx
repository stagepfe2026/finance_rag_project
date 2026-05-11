import { NavLink } from "react-router-dom";

type Props = {
  label: string;
  to: string;
  icon: any;
  isCollapsed: boolean;
};

export default function SidebarItem({
  label,
  to,
  icon: Icon,
  isCollapsed,
}: Props) {
  return (
    <div className="group relative">
      <NavLink
        to={to}
        aria-label={label}
        className={({ isActive }) =>
          [
            "flex h-11 items-center rounded-md text-xs font-medium transition",
            isCollapsed ? "justify-center" : "gap-3 px-3",
            isActive
              ? "bg-red-50 text-[#9d0208]"
              : "text-gray-700 hover:bg-gray-100 admin-sidebar-link",
          ].join(" ")
        }
      >
        <Icon size={14} />
        {!isCollapsed && <span>{label}</span>}
      </NavLink>

      {isCollapsed ? (
        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded border border-[#e5eaf2] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#071f3d] opacity-0 shadow-lg transition group-hover:opacity-100">
          {label}
        </span>
      ) : null}
    </div>
  );
}
