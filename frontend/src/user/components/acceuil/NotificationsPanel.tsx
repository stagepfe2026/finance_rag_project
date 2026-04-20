import { Link } from "react-router-dom";

import SectionCard from "./SectionCard";
import type { NotificationItem } from "./types/acceuil.types";

interface NotificationsPanelProps {
  items: NotificationItem[];
}

export default function NotificationsPanel({ items }: NotificationsPanelProps) {
  return (
    <SectionCard title="Notifications" action={<span className="text-xs text-blue-900">Voir toutes</span>}>
      <div className="space-y-3">
        {items.length === 0 ? <p className="text-sm text-slate-500">Aucune notification pour le moment.</p> : null}
        {items.map((item) => {
          const content = (
            <div className="flex gap-2">
              <span className={`mt-1 h-2 w-2 rounded-full ${item.isRead ? "bg-slate-300" : "bg-red-600"}`} />
              <div>
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
                <p className="text-[10px] text-slate-400">{item.time}</p>
              </div>
            </div>
          );

          return item.link ? (
            <Link key={item.id} to={item.link} className="block rounded-lg p-1 transition hover:bg-slate-50">
              {content}
            </Link>
          ) : (
            <div key={item.id}>{content}</div>
          );
        })}
      </div>
    </SectionCard>
  );
}
