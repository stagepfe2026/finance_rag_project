import type { LucideIcon } from "lucide-react";
import SidebarItem from "./SidebarItem";

type MenuItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

type Props = {
  items: MenuItem[];
  isCollapsed: boolean;
};

export default function SidebarMenu({ items, isCollapsed }: Props) {
  return (
    
    <ul className="space-y-1 py-2">
        
      {items.map((item) => (
        <li key={item.label}>
          <SidebarItem
            label={item.label}
            to={item.to}
            icon={item.icon}
            isCollapsed={isCollapsed}
          />
        </li>
      ))}
    </ul>
  );
}