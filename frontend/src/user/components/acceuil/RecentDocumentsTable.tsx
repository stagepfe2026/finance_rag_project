import React from "react";
import SectionCard from "./SectionCard";
import type { DocumentItem } from "./types/acceuil.types";

interface RecentDocumentsTableProps {
  documents: DocumentItem[];
}

const getCategoryStyle = (category: string) => {
  const styles: Record<string, React.CSSProperties> = {
    "LÉGISLATION": {
      color: "#c1121f",
      border: "1px solid #f2b8bd",
      background: "#fff5f5",
    },
    "PROCÉDURES": {
      color: "#142850",
      border: "1px solid #c7d2fe",
      background: "#f8faff",
    },
    "CIRCULAIRES": {
      color: "#4b5563",
      border: "1px solid #d1d5db",
      background: "#f9fafb",
    },
    "GUIDES": {
      color: "#111827",
      border: "1px solid #d1d5db",
      background: "#f3f4f6",
    },
  };

  return styles[category] || styles["GUIDES"];
};

export default function RecentDocumentsTable({ documents }) {
  return (
    <SectionCard
      title="Documents récemment ajoutés"
      action={<span className="text-xs text-red-600">Voir tous</span>}
    >
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-2">Titre</th>
            <th>Catégorie</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-t">
              <td className="py-3 text-sm text-slate-900">{doc.title}</td>
              <td className="text-xs">{doc.category}</td>
              <td className="text-xs text-slate-500">{doc.date}</td>
              <td>
                <button className="rounded-md border px-3 py-1 text-xs">
                  Consulter
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}