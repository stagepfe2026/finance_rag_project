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
        "group relative flex w-full items-center gap-2 border-l-[3px] py-4 pl-5 pr-4 text-left transition",
        isActive
          ? "border-l-[#E12D3A] bg-[linear-gradient(90deg,rgba(255,240,241,0.94)_0%,rgba(255,248,248,0.96)_100%)] text-[#273043]"
          : "border-l-transparent bg-white text-[#273043] hover:bg-[#fbfcff]",
      ].join(" ")}
    >
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 text-left">
       

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold leading-5 text-[#273043]">
            {conversation.summary || "Nouvelle conversation"}
          </span>
          <span className="mt-1 block truncate text-[10px] leading-4 text-[#6f7b9d]">{preview}</span>
        </span>

        {conversation.isArchived ? (
          <span className="shrink-0 rounded-full bg-[#f5f6fb] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[#6f7b9d]">
            Archivee
          </span>
        ) : null}

        {timeLabel ? (
          <span className="w-4 shrink-0 text-right text-[10px] font-medium text-[#5f6d93]">{timeLabel}</span>
        ) : null}
      </button>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((value) => !value)}
          className={[
            "inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6f7b9d] transition hover:bg-white hover:text-[#273043]",
            isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 cursor-pointer",
          ].join(" ")}
          aria-label="Actions de la conversation"
          aria-expanded={isMenuOpen}
        >
          <MoreHorizontal size={16} />
        </button>

        {isMenuOpen ? (
          <div className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[180px] rounded-xl border border-[#e8dfdc] bg-white p-1.5 shadow-[0_12px_36px_rgba(29,18,15,0.12)]">
            {!conversation.isArchived ? (
              <>
                <button
                  type="button"
                  onClick={() => handleMenuAction(() => onRename(conversation))}
                  className="flex w-full items-center gap-2 cursor-pointer rounded-xl px-3 py-2 text-left text-[12px] text-[#423633] transition hover:bg-[#faf6f5]"
                >
                  <Pencil size={14} />
                  Renommer
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuAction(() => onArchive(conversation))}
                  className="flex w-full items-center gap-2 cursor-pointer rounded-lg px-3 py-2 text-left text-xs text-[#423633] transition hover:bg-[#faf6f5]"
                >
                  <Archive size={14} />
                  Archiver
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleMenuAction(() => onRestore(conversation))}
                className="flex w-full items-center gap-2 cursor-pointer rounded-lg px-3 py-2 text-left text-xs text-[#423633] transition hover:bg-[#faf6f5]"
              >
                <RotateCcw size={14} />
                Restaurer
              </button>
            )}

            <button
              type="button"
              onClick={() => handleMenuAction(() => onDelete(conversation))}
              className="flex w-full items-center gap-2 rounded-lg cursor-pointer px-3 py-2   text-left text-xs text-[#9d0208] transition hover:bg-[#fff4f2]"
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
