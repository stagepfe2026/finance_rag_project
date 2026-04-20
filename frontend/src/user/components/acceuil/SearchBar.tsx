import React, { useState } from "react";

interface SearchBarProps {
  onSearch?: (value: string) => void;
}
export default function SearchBar() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <input
        placeholder="Que cherchez-vous aujourd’hui ?"
        className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none"
      />

      <button className="h-9 rounded-lg bg-[#142850] px-4 text-xs font-semibold text-white">
        Rechercher
      </button>
    </div>
  );
}