import type { FormEvent } from "react";

interface SearchBarProps {
  onSearch?: (value: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = String(formData.get("query") ?? "").trim();
    onSearch?.(value);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <input
        name="query"
        placeholder="Que cherchez-vous aujourd'hui ?"
        className="h-9 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none"
      />

      <button type="submit" className="h-9 rounded-xl bg-[#273043] px-4 text-xs font-semibold text-white">
        Rechercher
      </button>
    </form>
  );
}
