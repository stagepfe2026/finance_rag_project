import type { ReactNode } from "react";

import type { ChatFeedback, ChatMessage } from "../../../models/chat";
import StructuredAssistantResponse from "../../chat/StructuredAssistantResponse";
import MessageActions from "./MessageActions";

type MessageBubbleProps = {
  message: ChatMessage;
  searchQuery?: string;
  onFeedback: (messageId: string, feedback: ChatFeedback) => void;
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

export default function MessageBubble({ message, searchQuery = "", onFeedback }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isPendingAssistant =
    message.role === "assistant" && (message.pending || message.status === "generating");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[92%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={[
            "rounded-lg px-3 py-2 text-[12px] leading-5 shadow-sm",
            isUser
              ? "bg-[#9d0208] text-white"
              : "border border-slate-200 bg-white text-[#273043]",
            isPendingAssistant ? "italic text-slate-500" : "",
          ].join(" ")}
        >
          {isUser || isPendingAssistant ? (
            <p className="whitespace-pre-line">{highlightText(message.content, searchQuery)}</p>
          ) : (
            <StructuredAssistantResponse
              content={message.content}
              searchQuery={searchQuery}
              highlightText={highlightText}
            />
          )}
        </div>

        <div className="mt-0.5 px-1 text-[10px] text-slate-400">
          {isPendingAssistant ? "En attente..." : formatTime(message.createdAt)}
        </div>

        {!isUser && !isPendingAssistant ? (
          <div className="mt-1 w-full max-w-[min(100%,48rem)]">
            <MessageActions
              content={message.content}
              sources={message.sources}
              feedback={message.feedback ?? null}
              onFeedback={(feedback) => onFeedback(message._id, feedback)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
