import { Search } from "lucide-react";

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
}: AuditFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[#efe4e1] px-5 py-4">
      <div className="flex h-11 min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-[#e3d8d5] bg-[#faf7f6] px-3">
        <Search size={15} className="text-[#9f8f8c]" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher une activite, un ticket ou un utilisateur ..."
          className="w-full bg-transparent text-sm text-[#201d1d] outline-none placeholder:text-[#ad9d9a]"
        />
      </div>

      <select
        value={userFilter}
        onChange={(event) => onUserFilterChange(event.target.value)}
        className="h-11 rounded-xl border border-[#e3d8d5] bg-white px-3 text-sm text-[#4b4341] outline-none transition focus:border-[#9d0208]"
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
        className="h-11 rounded-xl border border-[#e3d8d5] bg-white px-3 text-sm text-[#4b4341] outline-none transition focus:border-[#9d0208]"
      >
        <option value="ALL">Tous les types</option>
        {actionTypes.map((action) => (
          <option key={action.value} value={action.value}>
            {action.label}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right md:block">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#a08f8c]">Export</p>
          <p className="mt-1 text-[12px] text-[#6d6260]">
            {userFilter === "ALL" ? "Filtre courant" : "Activites du user selectionne"}
          </p>
        </div>
        <AuditExportMenu activities={filteredActivities} prefix={exportPrefix} />
      </div>
    </div>
  );
}
