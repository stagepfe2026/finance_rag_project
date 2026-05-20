import { useEffect, useRef, useState } from "react";
import { Archive, MoreHorizontal, Pencil, RotateCcw, Trash2 } from "lucide-react";

import type { Conversation } from "../../../models/chat";

type ConversationItemProps = {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onRename: (conversation: Conversation) => void;
  onArchive: (conversation: Conversation) => void;
  onRestore: (conversation: Conversation) => void;
  onDelete: (conversation: Conversation) => void;
};

function formatConversationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.floor((todayStart - dateStart) / 86_400_000);

  if (diffDays <= 0) {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  if (diffDays === 1) {
    return "Hier";
  }

  if (diffDays < 7) {
    return `${diffDays} jours`;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(".", "");
}

function getConversationPreview(summary: string) {
  const trimmed = summary.trim();

  if (!trimmed) {
    return "Nouvelle conversation fiscale";
  }

  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

export default function ConversationItem({
  conversation,
  isActive,
  onClick,
  onRename,
  onArchive,
  onRestore,
  onDelete,
}: ConversationItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) {
        return;
      }
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  function handleMenuAction(action: () => void) {
    setIsMenuOpen(false);
    action();
  }

  const timeLabel = formatConversationTime(conversation.updatedAt);
  const preview = getConversationPreview(conversation.summary);

  return (
    <div
      className={[
        "group relative flex w-full items-center gap-2 border-l-2 px-3 py-2.5 text-left transition",
        isActive
          ? "border-l-[#9d0208] bg-[#fff7f7] text-[#273043]"
          : "border-l-transparent bg-white text-[#273043] hover:bg-slate-50",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Ouvrir la conversation ${conversation.summary || "Nouvelle conversation"}`}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
       

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold leading-5 text-[#273043]">
            {conversation.summary || "Nouvelle conversation"}
          </span>
          <span className="block truncate text-[10px] leading-4 text-slate-500">{preview}</span>
        </span>

        {conversation.isArchived ? (
          <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.06em] text-slate-500">
            Archivee
          </span>
        ) : null}

        {timeLabel ? (
          <span className="w-8 shrink-0 text-right text-[10px] font-medium text-slate-500">{timeLabel}</span>
        ) : null}
      </button>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((value) => !value)}
          className={[
            "inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-[#273043]",
            isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          ].join(" ")}
          aria-label="Actions de la conversation"
          aria-expanded={isMenuOpen}
        >
          <MoreHorizontal size={16} />
        </button>

        {isMenuOpen ? (
          <div className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[170px] rounded-lg border border-slate-200 bg-white p-1 shadow-[0_12px_28px_rgba(39,48,67,0.12)]">
            {!conversation.isArchived ? (
              <>
                <button
                  type="button"
                  aria-label={`Renommer la conversation ${conversation.summary || "Nouvelle conversation"}`}
                  onClick={() => handleMenuAction(() => onRename(conversation))}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-[#273043] transition hover:bg-slate-50"
                >
                  <Pencil size={14} />
                  Renommer
                </button>
                <button
                  type="button"
                  aria-label={`Archiver la conversation ${conversation.summary || "Nouvelle conversation"}`}
                  onClick={() => handleMenuAction(() => onArchive(conversation))}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-[#273043] transition hover:bg-slate-50"
                >
                  <Archive size={14} />
                  Archiver
                </button>
              </>
            ) : (
              <button
                type="button"
                aria-label={`Restaurer la conversation ${conversation.summary || "Nouvelle conversation"}`}
                onClick={() => handleMenuAction(() => onRestore(conversation))}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-[#273043] transition hover:bg-slate-50"
              >
                <RotateCcw size={14} />
                Restaurer
              </button>
            )}

            <button
              type="button"
              aria-label={`Supprimer la conversation ${conversation.summary || "Nouvelle conversation"}`}
              onClick={() => handleMenuAction(() => onDelete(conversation))}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-[#9d0208] transition hover:bg-[#fff4f2]"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
