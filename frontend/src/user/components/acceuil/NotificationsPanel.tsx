import { X } from "lucide-react";
import { Link } from "react-router-dom";

import SectionCard from "./SectionCard";
import type { NotificationItem } from "./types/acceuil.types";

interface NotificationsPanelProps {
  items: NotificationItem[];
  onDismiss: (id: string) => void;
}

export default function NotificationsPanel({ items, onDismiss }: NotificationsPanelProps) {
  return (
    <SectionCard title="Notifications">
      <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1 [scrollbar-color:rgba(148,163,184,0.35)_transparent] [scrollbar-width:thin]">
        {items.length === 0 ? <p className="text-sm text-slate-500">Aucune notification pour le moment.</p> : null}
        {items.map((item) => {
          const content = (
            <div className="group flex translate-x-0 items-start gap-2 transition duration-200 hover:-translate-x-1">
              <span className={`mt-1 h-2 w-2 rounded-full ${item.isRead ? "bg-slate-300" : "bg-red-600"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
                <p className="text-[10px] text-slate-400">{item.time}</p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDismiss(item.id);
                }}
                className="opacity-0 transition group-hover:opacity-100 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-[#b2342c]"
                title="Supprimer la notification"
              >
                <X size={14} />
              </button>
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
