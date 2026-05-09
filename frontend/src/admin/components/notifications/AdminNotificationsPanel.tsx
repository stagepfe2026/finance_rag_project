import { Bell, Check, Clock, FileX, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { NotificationItem } from "../../../models/notification";

type Props = {
  open: boolean;
  items: NotificationItem[];
  isLoading: boolean;
  error: string;
  onClose: () => void;
  onMarkAsRead: (item: NotificationItem) => void;
  onDismiss: (id: string) => void;
};

type Filter = "all" | "unread" | "read";

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60_000));
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  const diffHours = Math.max(1, Math.round(diffMinutes / 60));
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `Il y a ${diffDays} j`;
}

function NotificationIcon({ type, isRead }: { type: string; isRead: boolean }) {
  const base = "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full";
  if (isRead) {
    return <div className={`${base} bg-[#f0f3f8] text-[#8a96ad]`}><Bell size={14} /></div>;
  }
  switch (type) {
    case "urgent_reclamation":
      return <div className={`${base} bg-rose-50 text-rose-600`}><TriangleAlert size={14} /></div>;
    case "sla_overdue":
      return <div className={`${base} bg-amber-50 text-amber-600`}><Clock size={14} /></div>;
    case "indexation_failed":
      return <div className={`${base} bg-[#f0f3f8] text-[#5f6680]`}><FileX size={14} /></div>;
    default:
      return <div className={`${base} bg-[#f5e6e7] text-[#9d0208]`}><Bell size={14} /></div>;
  }
}

export default function AdminNotificationsPanel({
  open, items, isLoading, error, onClose, onMarkAsRead, onDismiss,
}: Props) {
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  const [filter, setFilter] = useState<Filter>("all");

  const unreadCount = items.filter((i) => !i.isRead).length;
  const readCount = items.length - unreadCount;
  const filteredItems = items.filter((i) => {
    if (filter === "unread") return !i.isRead;
    if (filter === "read") return i.isRead;
    return true;
  });

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
    setIsVisible(false);
    const timer = window.setTimeout(() => setIsMounted(false), 220);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!isMounted) return;
    function handleEscape(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMounted, onClose]);

  if (!isMounted) return null;

  const filterTabs: Array<{ value: Filter; label: string }> = [
    { value: "all",    label: "Toutes" },
    { value: "unread", label: `Non lues (${unreadCount})` },
    { value: "read",   label: `Lues (${readCount})` },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fermer le panneau"
        onClick={onClose}
        className={[
          "absolute inset-0 bg-[rgba(7,31,61,0.18)] transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />

      {/* Panel */}
      <aside
        className={[
          "absolute right-0 top-0 h-full w-[min(30vw,420px)] min-w-[320px] flex flex-col",
          "border-l border-[#e5eaf2] bg-white shadow-[-18px_0_40px_rgba(7,31,61,0.12)]",
          "transition-transform duration-200 ease-out",
          isVisible ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-label="Notifications administrateur"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[#e5eaf2] px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[17px] font-bold text-[#071f3d]">Notifications</h2>
              <p className="mt-1 text-[11px] text-[#8a96ad]">
                {items.length} notification{items.length !== 1 ? "s" : ""}
                {unreadCount > 0 ? `, ${unreadCount} non lue${unreadCount !== 1 ? "s" : ""}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#8a96ad] transition hover:bg-[#f0f3f8] hover:text-[#9d0208]"
              aria-label="Fermer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="shrink-0 border-b border-[#e5eaf2] px-5">
          <div className="flex gap-5">
            {filterTabs.map((tab) => {
              const isActive = filter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setFilter(tab.value)}
                  className={[
                    "relative py-3 text-[11px] font-semibold transition cursor-pointer",
                    isActive ? "text-[#9d0208]" : "text-[#8a96ad] hover:text-[#071f3d]",
                  ].join(" ")}
                >
                  {tab.label}
                  <span
                    className={[
                      "absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-[#9d0208] transition-transform duration-200",
                      isActive ? "scale-x-100" : "scale-x-0",
                    ].join(" ")}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <p className="px-5 pt-4 text-[11px] text-[#8a96ad]">Chargement...</p>
          )}

          {!isLoading && error && (
            <div className="m-4 rounded border  border-[#f3c6cc] bg-[#f5e6e7] px-3 py-2.5 text-[11px] text-[#9d0208]">
              {error}
            </div>
          )}

          {!isLoading && !error && items.length === 0 && (
            <div className="m-4 rounded border border-dashed border-[#e5eaf2] px-4 py-6 text-center text-[11px] text-[#8a96ad]">
              Aucune notification.
            </div>
          )}

          {!isLoading && !error && items.length > 0 && filteredItems.length === 0 && (
            <div className="m-4 rounded border border-dashed border-[#e5eaf2] px-4 py-6 text-center text-[11px] text-[#8a96ad]">
              {filter === "unread" ? "Aucune notification non lue." : "Aucune notification lue."}
            </div>
          )}

          {!isLoading && !error && filteredItems.length > 0 && (
            <div className="divide-y divide-[#f0f3f8]">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className={[
                    "px-5 py-3 transition hover:bg-[#f7f9fc]",
                    !item.isRead ? "bg-[#fdfbfb]" : "bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3 ">
                    <NotificationIcon type={item.type} isRead={item.isRead} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {!item.isRead && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#9d0208]" />
                        )}
                        <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-[#071f3d]">
                          {item.title}
                        </p>
                      </div>
                      <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-[#8a96ad]">
                        {item.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-[#b0b8c9]">
                        <span>{formatRelativeDate(item.createdAt)}</span>
                        {!item.isRead && (
                          <button
                            type="button"
                            onClick={() => onMarkAsRead(item)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-[#f0f3f8] px-2 py-0.5 text-[10px] font-semibold text-[#071f3d] transition hover:bg-[#e5eaf2]"
                          >
                            <Check size={10} />
                            Marquer comme lu
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDismiss(item.id)}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#b0b8c9] transition hover:bg-[#f0f3f8] hover:text-[#9d0208]"
                      aria-label="Retirer la notification"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
