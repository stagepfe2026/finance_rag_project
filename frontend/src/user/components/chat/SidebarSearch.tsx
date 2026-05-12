import { Search } from "lucide-react";

type SidebarSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SidebarSearch({ value, onChange }: SidebarSearchProps) {
  return (
    <label className="flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5">
      <Search size={14} className="text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Rechercher une conversation..."
        className="w-full bg-transparent text-[12px] text-[#273043] outline-none placeholder:text-slate-400"
      />
    </label>
  );
}
