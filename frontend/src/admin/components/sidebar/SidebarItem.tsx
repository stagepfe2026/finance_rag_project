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
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex h-11 items-center rounded-md text-xs font-medium transition ",
          isCollapsed ? "justify-center" : "gap-3 px-3",
          isActive
            ? "bg-red-50 text-[#9d0208] "
            : "text-gray-700 hover:bg-gray-100",
        ].join(" ")
      }
    >
      <Icon size={14} />
      {!isCollapsed && <span>{label}</span>}
    </NavLink>
  );
}