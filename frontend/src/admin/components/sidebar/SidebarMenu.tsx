import SidebarItem from "./SidebarItem";

type Props = {
  items: any[];
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