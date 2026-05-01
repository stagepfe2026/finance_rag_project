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
        <div className="px-5 py-10 text-sm text-[#7f7270]">Chargement des activites...</div>
      ) : error ? (
        <div className="px-5 py-10 text-sm text-[#9d0208]">{error}</div>
      ) : filteredActivitiesCount === 0 ? (
        <div className="px-5 py-10 text-sm text-[#7f7270]">Aucune activite ne correspond aux filtres.</div>
      ) : (
        <table className="min-w-full text-left">
          <thead className="bg-[#faf7f6] text-[11px] uppercase tracking-[0.1em] text-[#998b88]">
            <tr>
              <th className="px-5 py-3 font-semibold">Utilisateur</th>
              <th className="px-5 py-3 font-semibold">Action</th>
              <th className="px-5 py-3 font-semibold">Element</th>
              <th className="px-5 py-3 font-semibold">Categorie</th>
              <th className="px-5 py-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedActivities.map((activity) => (
              <tr
                key={activity.id}
                onClick={() => onSelectActivity(activity.id)}
                className="cursor-pointer border-t border-[#f2e9e6] transition hover:bg-[#fff5f4]"
              >
                <td className="px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#231f1f]">{activity.userName || "Utilisateur"}</p>
                    <p className="mt-1 truncate text-[12px] text-[#857977]">{activity.userEmail || "-"}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getActionClassName(activity.actionType)}`}>
                    {activity.actionLabel}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#2b2726]">{activity.entityLabel}</p>
                    <p className="mt-1 truncate text-[12px] text-[#857977]">{activity.summary}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getCategoryClassName(activity.category)}`}>
                    {activity.category}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-[#5e5452]">{formatDateTime(activity.occurredAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
