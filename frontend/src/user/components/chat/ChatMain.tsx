import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Search, X } from "lucide-react";

import type { ChatFeedback, ChatMessage, Conversation, ResponseMode } from "../../../models/chat";
import { exportConversationToPdf } from "../../utils/chatPdf";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";

type ChatMainProps = {
  conversation: Conversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string;
  responseMode: ResponseMode;
  onResponseModeChange: (mode: ResponseMode) => void;
  onSubmit: (content: string) => Promise<void>;
  onFeedback: (messageId: string, feedback: ChatFeedback) => void;
  onNotify?: (message: string, tone?: "success" | "error" | "info") => void;
};

export default function ChatMain({
  conversation,
  messages,
  isLoading,
  isSubmitting,
  error,
  responseMode,
  onResponseModeChange,
  onSubmit,
  onFeedback,
  onNotify,
}: ChatMainProps) {
  const [value, setValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

  useEffect(() => {
    if (isSearchOpen) {
      window.setTimeout(() => searchInputRef.current?.focus(), 120);
      return;
    }
    setSearchQuery("");
  }, [isSearchOpen]);

  const searchResultsCount = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return 0;
    }

    return messages.filter((message) => message.content.toLowerCase().includes(normalizedQuery)).length;
  }, [messages, searchQuery]);

  async function handleSubmit() {
    const nextValue = value.trim();
    if (!nextValue || isSubmitting) {
      return;
    }

    setValue("");
    await onSubmit(nextValue);
  }

  function handleExportPdf() {
    try {
      exportConversationToPdf(conversation, messages);
      onNotify?.("Conversation exportee en PDF.", "success");
    } catch (pdfError) {
      onNotify?.(
        pdfError instanceof Error ? pdfError.message : "Impossible d exporter la conversation en PDF.",
        "error",
      );
    }
  }

  return (
<main className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-[#ece1de] bg-white shadow-sm">        <div className="border-b border-[#eee7e5] px-3 py-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate py-2 ml-3 text-sm font-semibold text-[#273043]">
              {conversation?.summary || "Nouvelle discussion"}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-center">
            <div className="inline-flex items-center rounded-full border border-[#ddd3d0] bg-white p-1  ">
              <button
                type="button"
                onClick={() => onResponseModeChange("short")}
                className={[
                  "rounded-full px-3 py-1 text-[11px] font-medium transition cursor-pointer",
                  responseMode === "short"
                    ? "bg-[#273043] text-white"
                    : "text-[#273043] hover:bg-[#f3f5ff]",
                ].join(" ")}
              >
                Court
              </button>
              <button
                type="button"
                onClick={() => onResponseModeChange("detailed")}
                className={[
                  "rounded-full px-3 py-1 text-[11px] font-medium transition cursor-pointer",
                  responseMode === "detailed"
                    ? "bg-[#273043] text-white"
                    : "text-[#273043] hover:bg-[#f3f5ff]",
                ].join(" ")}
              >
                Detaille
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={!conversation || messages.length === 0}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd3d0] bg-white text-[#273043] transition hover:border-[#273043] hover:text-[#273043] disabled:cursor-not-allowed disabled:opacity-50"
              title="Exporter la conversation en PDF"
              aria-label="Exporter la conversation en PDF"
            >
              <FileText size={17} />
            </button>

            <div className="flex items-center gap-2 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsSearchOpen((value) => !value)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd3d0] bg-white text-[#273043] transition hover:border-[#273043] hover:text-[#273043]"
                title="Rechercher dans la conversation"
                aria-label="Rechercher dans la conversation"
                aria-expanded={isSearchOpen}
              >
                {isSearchOpen ? <X size={17} /> : <Search size={17} />}
              </button>

              <div
                className={[
                  "transition-all duration-300 ease-out",
                  isSearchOpen ? "w-[230px] opacity-100" : "w-0 opacity-0",
                ].join(" ")}
              >
                <div className="flex items-center rounded-full border border-[#ddd3d0] bg-white px-3">
                  <Search size={14} className="shrink-0 text-[#8a7f7b]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Rechercher..."
                    className="h-9 w-full bg-transparent px-2 text-[12px] text-[#2f2725] outline-none placeholder:text-[#9a8e8a]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-[#8a7f7b]">
          {isSearchOpen ? (
            <span>
              {searchQuery.trim()
                ? `${searchResultsCount} resultat${searchResultsCount > 1 ? "s" : ""} dans cette conversation`
                : "Saisissez un mot-cle pour rechercher dans les messages utilisateur et assistant."}
            </span>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5 pr-2 md:px-4 md:py-3 md:pr-3">
        {error ? (
          <div className="mb-2 rounded-xl border border-[#f0d5d2] bg-[#fff6f5] px-3 py-2 text-[11px] text-[#9d0208]">
            {error}
          </div>
        ) : null}

        <MessageList messages={messages} isLoading={isLoading} searchQuery={searchQuery} onFeedback={onFeedback} />
        <div ref={bottomRef} />
      </div>

      <div className="bg-slate-50 px-3 py-3 md:px-4">
        <ChatInput value={value} onChange={setValue} onSubmit={handleSubmit} disabled={false} />
      </div>
    </main>
  );
}
