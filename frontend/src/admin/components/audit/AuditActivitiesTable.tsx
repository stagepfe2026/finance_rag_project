import type { AuditActivity } from "../../../models/audit";
import { formatDateTime, getActionClassName, getCategoryClassName } from "./auditHelpers";

type AuditActivitiesTableProps = {
  isLoading: boolean;
  error: string;
  filteredActivitiesCount: number;
  paginatedActivities: AuditActivity[];
  onSelectActivity: (activityId: string) => void;
};

export default function AuditActivitiesTable({
  isLoading,
  error,
  filteredActivitiesCount,
  paginatedActivities,
  onSelectActivity,
}: AuditActivitiesTableProps) {
  return (
    <div className="overflow-x-auto">
      {isLoading ? (
        <div className="px-4 py-10 text-sm text-[#8a96ad]">Chargement des activités...</div>
      ) : error ? (
        <div className="px-4 py-10 text-sm text-[#9d0208]">{error}</div>
      ) : filteredActivitiesCount === 0 ? (
        <div className="px-4 py-10 text-sm text-[#8a96ad]">Aucune activité ne correspond aux filtres.</div>
      ) : (
        <table className="w-full min-w-full text-left">
          <thead>
            <tr className="bg-[#f7f9fc] text-[10px] font-semibold uppercase text-red-700">
              <th className="whitespace-nowrap px-4 py-2.5">Utilisateur</th>
              <th className="whitespace-nowrap px-4 py-2.5">Action</th>
              <th className="whitespace-nowrap px-4 py-2.5">Élément</th>
              <th className="whitespace-nowrap px-4 py-2.5">Catégorie</th>
              <th className="whitespace-nowrap px-4 py-2.5">Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedActivities.map((activity) => (
              <tr
                key={activity.id}
                onClick={() => onSelectActivity(activity.id)}
                className="cursor-pointer border-t border-[#e5eaf2] transition-colors hover:bg-[#f7f9fc]"
              >
                <td className="px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#071f3d]">{activity.userName || "Utilisateur"}</p>
                    <p className="mt-1 truncate text-[11px] text-[#8a96ad]">{activity.userEmail || "-"}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${getActionClassName(activity.actionType)}`}>
                    {activity.actionLabel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#071f3d]">{activity.entityLabel}</p>
                    <p className="mt-1 truncate text-[11px] text-[#8a96ad]">{activity.summary}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${getCategoryClassName(activity.category)}`}>
                    {activity.category}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-[#5f6680]">{formatDateTime(activity.occurredAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
