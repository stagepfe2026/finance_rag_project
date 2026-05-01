import { BellRing, Check, CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { NotificationItem } from "../../../models/notification";

type UserNotificationsModalProps = {
  open: boolean;
  items: NotificationItem[];
  isLoading: boolean;
  error: string;
  onClose: () => void;
  onDismiss: (notificationId: string) => void;
  onMarkAsRead: (notification: NotificationItem) => void;
};

type NotificationFilter = "all" | "unread" | "read";

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60_000));
  if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} min`;
  }

  const diffHours = Math.max(1, Math.round(diffMinutes / 60));
  if (diffHours < 24) {
    return `Il y a ${diffHours} h`;
  }

  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `Il y a ${diffDays} j`;
}

export default function UserNotificationsModal({
  open,
  items,
  isLoading,
  error,
  onClose,
  onDismiss,
  onMarkAsRead,
}: UserNotificationsModalProps) {
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const unreadCount = items.filter((item) => !item.isRead).length;
  const readCount = items.length - unreadCount;
  const filteredItems = items.filter((item) => {
    if (activeFilter === "unread") {
      return !item.isRead;
    }

    if (activeFilter === "read") {
      return item.isRead;
    }

    return true;
  });
  const filterOptions: Array<{ value: NotificationFilter; label: string }> = [
    { value: "all", label: "Toutes" },
    { value: "unread", label: `Non lues (${unreadCount})` },
    { value: "read", label: `Lues (${readCount})` },
  ];

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
    if (!isMounted) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMounted, onClose]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <button
        type="button"
        aria-label="Fermer le panneau des notifications"
        onClick={onClose}
        className={[
          "absolute inset-0 bg-[rgba(17,24,39,0.18)] transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />

      <aside
        className={[
          "absolute right-0 top-0 h-full w-[min(30vw,440px)] min-w-[320px] border-l border-slate-200 bg-white shadow-[-18px_0_40px_rgba(17,24,39,0.12)] transition-transform duration-200 ease-out",
          isVisible ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-label="Notifications"
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 bg-white px-6 pb-5 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                  <h2 className="mt-2 text-[20px] font-bold text-[#9d0208]">Notifications</h2>                <p className="mt-2 text-[13px] text-slate-500 ">
                  {items.length} notification{items.length > 1 ? "s" : ""}
                  {unreadCount > 0 ? `, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#9d0208]"
                aria-label="Fermer le panneau des notifications"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-white px-6">
            <div className="grid grid-cols-3 gap-3">
              {filterOptions.map((option) => {
                const isActive = activeFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setActiveFilter(option.value)}
                    className={[
                      "relative flex min-h-12 items-center justify-center px-1 text-[13px] font-semibold transition",
                      isActive ? "text-[#9d0208]" : "text-slate-500 hover:text-[#273043]",
                    ].join(" ")}
                  >
                    {option.label}
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

          <div className="flex-1 overflow-y-auto bg-white">
            {isLoading ? (
              <div className="mx-6 mt-5 rounded-xl border border-slate-200 bg-white p-4 text-[13px] text-slate-500">
                Chargement des notifications...
              </div>
            ) : null}

            {!isLoading && error ? (
              <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
                {error}
              </div>
            ) : null}

            {!isLoading && !error && items.length === 0 ? (
              <div className="mx-6 mt-5 rounded-xl border border-dashed border-slate-200 bg-white p-6 text-[13px] text-slate-500">
                Aucune notification pour le moment.
              </div>
            ) : null}

            {!isLoading && !error && items.length > 0 && filteredItems.length === 0 ? (
              <div className="mx-6 mt-5 rounded-xl border border-dashed border-slate-200 bg-white p-6 text-[13px] text-slate-500">
                {activeFilter === "unread" ? "Aucune notification non lue." : "Aucune notification lue."}
              </div>
            ) : null}

            {!isLoading && !error && filteredItems.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {filteredItems.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white px-6 py-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={[
                          "mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          item.isRead ? "bg-slate-100 text-slate-400" : "bg-red-50 text-[#9d0208]",
                        ].join(" ")}
                      >
                        {item.isRead ? <CheckCircle2 size={16} /> : <BellRing size={16} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {!item.isRead ? <span className="h-2 w-2 rounded-full bg-[#9d0208]" /> : null}
                          <h3 className="line-clamp-2 text-[14px] font-semibold leading-5 text-[#273043]">
                            {item.title}
                          </h3>
                        </div>
                        <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-slate-500">{item.description}</p>
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{formatRelativeDate(item.createdAt)}</span>
                          {!item.isRead ? (
                            <button
                              type="button"
                              onClick={() => onMarkAsRead(item)}
                              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2 py-1 font-semibold text-[#273043] transition hover:bg-slate-200"
                            >
                              <Check size={12} />
                              Marquer comme lu
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDismiss(item.id)}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-[#9d0208]"
                        aria-label="Retirer la notification"
                        title="Retirer"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
