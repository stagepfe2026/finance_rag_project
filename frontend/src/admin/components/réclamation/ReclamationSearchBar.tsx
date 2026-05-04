import { Search } from "lucide-react";

type ReclamationSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ReclamationSearchBar({ value, onChange }: ReclamationSearchBarProps) {
  return (
    <div className="flex h-9 min-w-[260px] flex-1 items-center gap-2 rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3">
      <Search size={14} className="text-[#8a96ad]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Rechercher par ticket, sujet ou email..."
        className="w-full bg-transparent text-[12px] text-[#071f3d] outline-none placeholder:text-[#8a96ad]"
      />
    </div>
  );
}
