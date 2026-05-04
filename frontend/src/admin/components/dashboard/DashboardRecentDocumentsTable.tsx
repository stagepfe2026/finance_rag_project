import type { AdminDashboardIndexedDocument } from "../../../models/admin-dashboard";
import { formatDateTime, getCategoryLabel } from "./dashboardFormatters";

export default function DashboardRecentDocumentsTable({
  documents,
}: {
  documents: AdminDashboardIndexedDocument[];
}) {
  return (
    <div className="rounded border border-[#e5eaf2] rounded-lg bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5eaf2] px-4 py-2">
        <div>
          <h2 className="mt-0.5 text-sm font-bold text-[#071f3d]">Liste récente</h2>
        </div>
        <span className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-2.5 py-1 text-[10px] font-semibold text-[#071f3d]">
          {documents.length} élément{documents.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="bg-[#f7f9fc] text-[10px] uppercase  font-semibold text-red-700">
              {["Titre", "Catégorie", "Type", "Date publication","Date en vigueur"].map(h => (
                <th key={h} className="px-4 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-[12px] text-[#8a96ad]">
                  Aucun document indexé récent.
                </td>
              </tr>
            ) : (
              documents.map(doc => (
                <tr key={doc.id} className="border-t border-[#e5eaf2] hover:bg-[#f7f9fc] transition-colors">
                  <td className="px-4 py-3">
                    <p className="max-w-[240px] truncate text-xs font-semibold text-[#071f3d]">
                      {doc.title}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[#f5e6e7] text-[#9d0208]`}>
                      {getCategoryLabel(doc.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5f6680]">{doc.fileType || "—"}</td>
                  <td className="px-4 py-3 text-xs text-[#5f6680] whitespace-nowrap">
                    {formatDateTime(doc.publicationDate)}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5f6680] whitespace-nowrap">
                    {formatDateTime(doc.effectiveDate)}
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
