import { Search } from "lucide-react";

type SidebarSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SidebarSearch({ value, onChange }: SidebarSearchProps) {
  return (
    <label className="flex h-9 items-center gap-2 rounded-lg border border-[#e7edf7] bg-white px-3 shadow-[0_8px_20px_rgba(39,48,67,0.04)]">
      <Search size={17} className="text-[#26356f]" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Rechercher une conversation..."
        className="w-full bg-transparent text-xs text-[#26356f] outline-none placeholder:text-[#8790ad]"
      />
    </label>
  );
}
