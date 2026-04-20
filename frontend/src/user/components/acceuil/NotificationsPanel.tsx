import React from "react";
import SectionCard from "./SectionCard";
import type { NotificationItem } from "./types/acceuil.types";

interface NotificationsPanelProps {
  items: NotificationItem[];
}

export default function NotificationsPanel({ items }) {
  return (
    <SectionCard
      title="Notifications"
      action={<span className="text-xs text-blue-900">Voir toutes</span>}
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-red-600" />

            <div>
              <p className="text-sm font-medium text-slate-900">
                {item.title}
              </p>

              <p className="text-xs text-slate-500">{item.description}</p>

              <p className="text-[10px] text-slate-400">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}