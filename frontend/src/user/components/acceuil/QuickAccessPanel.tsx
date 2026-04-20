import { Link } from "react-router-dom";

import SectionCard from "./SectionCard";
import type { QuickAccessItem } from "./types/acceuil.types";

interface QuickAccessPanelProps {
  items: QuickAccessItem[];
}

export default function QuickAccessPanel({ items }: QuickAccessPanelProps) {
  return (
    <SectionCard title="Acces rapide">
      <div className="divide-y">
        {items.map((item) => (
          <Link key={item.id} to={item.link} className="flex items-center justify-between py-3 text-sm">
            {item.label}
            <span className="text-slate-400">›</span>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
