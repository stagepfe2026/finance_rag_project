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

  return (
    <div
      className={[
        "relative flex w-full items-start gap-2 px-4 py-3 text-left transition ",
        isActive
          ? "bg-[linear-gradient(90deg,rgba(255,255,255,0.72)_0%,rgba(245,241,240,0.95)_100%)] text-[#2b2321]"
          : "bg-transparent text-[#4e4643] hover:bg-[rgba(255,255,255,0.45)]",
      ].join(" ")}
    >
      {isActive ? <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[#cb3a32]" /> : null}

      <button type="button" onClick={onClick} className="min-w-0 flex-1 text-left">
        <span className="block max-w-[210px] text-[13px] leading-5">{conversation.summary}</span>
        {conversation.isArchived ? (
          <span className="mt-1 inline-block text-[10px] uppercase tracking-[0.08em] text-[#9a7d76]">
            Archivee
          </span>
        ) : null}
      </button>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((value) => !value)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#7c706c] transition hover:bg-white/80 hover:text-[#2b2321]"
          aria-label="Actions de la conversation"
          aria-expanded={isMenuOpen}
        >
          <MoreHorizontal size={16} />
        </button>

        {isMenuOpen ? (
          <div className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[180px] rounded-2xl border border-[#e8dfdc] bg-white p-1.5 shadow-[0_12px_36px_rgba(29,18,15,0.12)]">
            {!conversation.isArchived ? (
              <>
                <button
                  type="button"
                  onClick={() => handleMenuAction(() => onRename(conversation))}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] text-[#423633] transition hover:bg-[#faf6f5]"
                >
                  <Pencil size={14} />
                  Renommer
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuAction(() => onArchive(conversation))}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] text-[#423633] transition hover:bg-[#faf6f5]"
                >
                  <Archive size={14} />
                  Archiver
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleMenuAction(() => onRestore(conversation))}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] text-[#423633] transition hover:bg-[#faf6f5]"
              >
                <RotateCcw size={14} />
                Restaurer
              </button>
            )}

            <button
              type="button"
              onClick={() => handleMenuAction(() => onDelete(conversation))}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] text-[#b42318] transition hover:bg-[#fff4f2]"
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
