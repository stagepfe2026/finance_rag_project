import { RotateCcw, Search } from "lucide-react";

import type { AuditActionFilter, AuditActivity, AuditUserFilter } from "../../../models/audit";
import AuditExportMenu from "./AuditExportMenu";

type AuditFiltersBarProps = {
  search: string;
  userFilter: string;
  actionFilter: string;
  users: AuditUserFilter[];
  actionTypes: AuditActionFilter[];
  filteredActivities: AuditActivity[];
  exportPrefix: string;
  onSearchChange: (value: string) => void;
  onUserFilterChange: (value: string) => void;
  onActionFilterChange: (value: string) => void;
  onResetFilters: () => void;
};

export default function AuditFiltersBar({
  search,
  userFilter,
  actionFilter,
  users,
  actionTypes,
  filteredActivities,
  exportPrefix,
  onSearchChange,
  onUserFilterChange,
  onActionFilterChange,
  onResetFilters,
}: AuditFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[#e5eaf2] px-4 py-3">
      <div className="flex h-9 min-w-[240px] flex-1 items-center gap-2 rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3">
        <Search size={14} className="text-[#8a96ad]" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher une activité, un ticket ou un utilisateur..."
          className="w-full bg-transparent text-[12px] text-[#071f3d] outline-none placeholder:text-[#8a96ad]"
        />
      </div>

      <select
        value={userFilter}
        onChange={(event) => onUserFilterChange(event.target.value)}
        className="h-9 rounded border border-[#e5eaf2] cursor-pointer bg-white px-3 text-[12px] font-semibold text-[#071f3d] outline-none transition focus:border-[#071f3d]"
      >
        <option value="ALL">Tous les utilisateurs</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>

      <select
        value={actionFilter}
        onChange={(event) => onActionFilterChange(event.target.value)}
        className="h-9 rounded border border-[#e5eaf2] cursor-pointer bg-white px-3 text-[12px] font-semibold text-[#071f3d] outline-none transition focus:border-[#071f3d]"
      >
        <option value="ALL">Tous les types</option>
        {actionTypes.map((action) => (
          <option key={action.value} value={action.value}>
            {action.label}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded border border-[#d8dee9] bg-white px-3 text-[11px] font-semibold text-[#071f3d] transition hover:border-[#071f3d] hover:bg-[#f7f9fc]"
        >
          <RotateCcw size={13} />
          Réinitialiser
        </button>

        <div className="hidden text-right md:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-red-700 ">Export</p>
         
        </div>
        <AuditExportMenu activities={filteredActivities} prefix={exportPrefix} />
      </div>
    </div>
  );
}
