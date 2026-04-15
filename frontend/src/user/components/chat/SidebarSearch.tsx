import { Search } from "lucide-react";

type SidebarSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SidebarSearch({ value, onChange }: SidebarSearchProps) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-[#e3dad8] bg-white px-2 py-2.5 ">
      <Search size={15} className="text-[#9d918d]" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Rechercher..."
        className="w-full bg-transparent text-[12px] text-[#534a47] outline-none placeholder:text-[#b1a6a2]"
      />
    </label>
  );
}
