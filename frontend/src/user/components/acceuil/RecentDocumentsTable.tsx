import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

import SectionCard from "./SectionCard";
import type { RecentDocumentItem } from "./types/acceuil.types";

interface RecentDocumentsTableProps {
  documents: RecentDocumentItem[];
}

const getCategoryStyle = (category: string) => {
  const styles: Record<string, CSSProperties> = {
    "Loi Finance": {
      color: "#c1121f",
      border: "1px solid #f2b8bd",
      background: "#fff5f5",
    },
    Juridique: {
      color: "#142850",
      border: "1px solid #c7d2fe",
      background: "#f8faff",
    },
    Conformite: {
      color: "#4b5563",
      border: "1px solid #d1d5db",
      background: "#f9fafb",
    },
    Autre: {
      color: "#111827",
      border: "1px solid #d1d5db",
      background: "#f3f4f6",
    },
  };

  return styles[category] || styles.Autre;
};

export default function RecentDocumentsTable({ documents }: RecentDocumentsTableProps) {
  return (
    <SectionCard title="Documents recemment ajoutes">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-2">Titre</th>
            <th>Categorie</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {documents.length === 0 ? (
            <tr className="border-t">
              <td colSpan={4} className="py-4 text-sm text-slate-500">
                Aucun document indexe pour le moment.
              </td>
            </tr>
          ) : null}
          {documents.map((doc) => (
            <tr key={doc.id} className="border-t">
              <td className="py-3 text-sm text-slate-900">{doc.title}</td>
              <td className="text-xs">
                <span className="rounded-full px-2 py-1" style={getCategoryStyle(doc.category)}>
                  {doc.category}
                </span>
              </td>
              <td className="text-xs text-slate-500">{doc.date}</td>
              <td>
                <Link to={doc.link} className="rounded-md border px-3 py-1 text-xs">
                  Consulter
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}
