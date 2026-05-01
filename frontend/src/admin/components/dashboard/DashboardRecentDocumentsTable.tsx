import { MoreVertical } from "lucide-react";

import type { AdminDashboardIndexedDocument } from "../../../models/admin-dashboard";
import { formatDateTime, getCategoryLabel } from "./dashboardFormatters";

export default function DashboardRecentDocumentsTable({ documents }: { documents: AdminDashboardIndexedDocument[] }) {
  return (
    <div className="rounded-lg border border-[#e0e6f0] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#6c7894]">Documents indexes</p>
          <h2 className="mt-1 text-[20px] font-bold text-[#071f3d]">Liste recente</h2>
        </div>
        <span className="rounded-full border border-[#e0e6f0] bg-white px-3 py-2 text-[12px] font-semibold text-[#071f3d]">
          {documents.length} elements
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[#f2f5fa] text-[10px] uppercase tracking-[0.1em] text-[#4c587a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Titre</th>
              <th className="px-4 py-3 font-semibold">Categorie</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Indexation</th>
              <th className="px-4 py-3 font-semibold">Chunks</th>
              <th className="px-4 py-3 font-semibold" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr className="border-t border-[#e8edf5]">
                <td colSpan={6} className="px-4 py-6 text-sm text-[#5f6680]">
                  Aucun document indexe recent.
                </td>
              </tr>
            ) : (
              documents.map((document) => (
                <tr key={document.id} className="border-t border-[#e8edf5] hover:bg-[#f7f9fc]">
                  <td className="px-4 py-4">
                    <p className="max-w-[280px] truncate text-sm font-bold text-[#071f3d]">{document.title}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-[#fff0f2] px-2.5 py-1 text-[10px] font-semibold text-[#9d0208]">
                      {getCategoryLabel(document.category)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#4c587a]">{document.fileType || "-"}</td>
                  <td className="px-4 py-4 text-sm text-[#4c587a]">{formatDateTime(document.indexedAt)}</td>
                  <td className="px-4 py-4 text-sm font-bold text-[#071f3d]">{document.chunksCount ?? "-"}</td>
                  <td className="px-4 py-4 text-right text-[#071f3d]">
                    <MoreVertical size={16} />
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
