import React from "react";
import SectionCard from "./SectionCard";
import type { QuickAccessItem } from "./types/acceuil.types";

interface QuickAccessPanelProps {
  items: QuickAccessItem[];
}
export default function QuickAccessPanel({ items }) {
  return (
    <SectionCard title="Accès rapide">
      <div className="divide-y">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-3 text-sm"
          >
            {item.label}
            <span className="text-slate-400">›</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}