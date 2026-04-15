import type { ReactNode } from "react";

import type { ChatMessage } from "../../../models/chat";
import MessageActions from "./MessageActions";

type MessageBubbleProps = {
  message: ChatMessage;
  searchQuery?: string;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(content: string, query: string): ReactNode {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return content;
  }

  const pattern = new RegExp(`(${escapeRegExp(normalizedQuery)})`, "gi");
  const parts = content.split(pattern);

  return parts.map((part, index) =>
    part.toLowerCase() === normalizedQuery.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-[#f9d9d4] px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default function MessageBubble({ message, searchQuery = "" }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isPendingAssistant = message.role === "assistant" && message.pending;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[96%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={[
            "rounded-[15px] px-3 py-2 text-[12px] leading-5 shadow-sm",
            isUser
              ? "bg-[linear-gradient(135deg,#cf4338_0%,#b82f29_100%)] text-white"
              : "border border-[#ece3e1] bg-white text-[#2b2321]",
            isPendingAssistant ? "italic text-[#7a706d]" : "",
          ].join(" ")}
        >
          <p className="whitespace-pre-line">{highlightText(message.content, searchQuery)}</p>
        </div>

        <div className="mt-0.5 px-1 text-[10px] text-[#958885]">
          {isPendingAssistant ? "En attente..." : formatTime(message.createdAt)}
        </div>

        {!isUser && !isPendingAssistant ? (
          <div className="mt-1 w-full max-w-[min(100%,52rem)]">
            <MessageActions content={message.content} sources={message.sources} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
