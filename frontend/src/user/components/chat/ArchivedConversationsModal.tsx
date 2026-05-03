import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquareText, X } from "lucide-react";

import type { Conversation } from "../../../models/chat";

const ITEMS_PER_PAGE = 5;

type ArchivedConversationsModalProps = {
  open: boolean;
  conversations: Conversation[];
  busyConversationId?: string | null;
  onClose: () => void;
  onRestore: (conversation: Conversation) => Promise<void> | void;
};

function formatArchiveDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ArchivedConversationsModal({
  open,
  conversations,
  busyConversationId = null,
  onClose,
  onRestore,
}: ArchivedConversationsModalProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(conversations.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (!open) {
      return;
    }

    setPage(1);
  }, [open]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  const paginatedConversations = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return conversations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [conversations, page]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(43,35,33,0.46)] px-4 py-6 backdrop-blur-[2px]">
      <div className="w-full max-w-[760px] rounded-xl border border-[#ddd5d2] bg-[linear-gradient(180deg,#ffffff_0%,#fcfaf9_100%)] shadow-[0_24px_80px_rgba(39,24,20,0.22)]">
        <div className="flex items-center justify-between border-b border-[#eee7e5] px-6 py-5">
          <div className="w-10" />
          <h2 className="text-center text-sm font-semibold text-[#2f2725]">Conversations archivées</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#564d49] transition hover:bg-[#f6f0ef] hover:text-[#9d0208]"
            aria-label="Fermer la fenêtre des archives"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="overflow-hidden rounded-xl border border-[#eee7e5] bg-white">
            <div className="grid grid-cols-[minmax(0,1.6fr)_170px_130px] gap-4 border-b border-[#f0e9e7] px-6 py-4 text-[12px] font-semibold text-[#463d39]">
              <span>Titre de la conversation</span>
              <span>Date d'archivage</span>
              <span className="text-center">Action</span>
            </div>

            {paginatedConversations.length === 0 ? (
              <div className="px-6 py-10 text-center text-[13px] text-[#847975]">
                Aucune conversation archivée.
              </div>
            ) : (
              <div className="divide-y divide-[#f4eeec]">
                {paginatedConversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    className="grid grid-cols-[minmax(0,1.6fr)_170px_130px] items-center gap-4 px-6 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#faf5f4] text-[#5b524e]">
                        <MessageSquareText size={16} />
                      </span>
                      <span className="truncate text-[13px] text-[#3d3532]">{conversation.summary}</span>
                    </div>

                    <span className="text-[13px] text-[#5f5652]">{formatArchiveDate(conversation.archivedAt)}</span>

                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => void onRestore(conversation)}
                        disabled={busyConversationId === conversation._id}
                        className="rounded-xl border border-[#efb4af] px-4 py-2 text-[12px] font-semibold text-[#9d0208] transition hover:bg-[#fff4f2] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyConversationId === conversation._id ? "Restauration..." : "Restaurer"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {conversations.length > ITEMS_PER_PAGE ? (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5d5552] transition hover:bg-[#f6f0ef] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Page précédente"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={[
                    "inline-flex h-8 min-w-8 items-center justify-center rounded-xl px-2 text-[12px] font-semibold transition",
                    pageNumber === page
                      ? "bg-[#9d0208] text-white shadow-[0_10px_22px_rgba(203,58,50,0.22)]"
                      : "text-[#4f4744] hover:bg-[#f6f0ef]",
                  ].join(" ")}
                  aria-current={pageNumber === page ? "page" : undefined}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5d5552] transition hover:bg-[#f6f0ef] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Page suivante"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
