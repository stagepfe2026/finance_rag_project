import type { ChatFeedback, ChatMessage } from "../../../models/chat";
import MessageBubble from "./MessageBubble";

type MessageListProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  searchQuery?: string;
  onFeedback: (messageId: string, feedback: ChatFeedback) => void;
};

export default function MessageList({ messages, isLoading, searchQuery = "", onFeedback }: MessageListProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMessages = normalizedQuery
    ? messages.filter((message) => message.content.toLowerCase().includes(normalizedQuery))
    : messages;

  if (isLoading) {
    return <p className="text-[11px] text-[#7f7673]">Chargement des messages...</p>;
  }

  if (messages.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-290px)] items-center justify-center px-2 py-6 text-center">
        <div className="w-full max-w-[620px]">
          <h2 className="text-base font-semibold text-[#273043]">Demarrez une conversation</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500 ">
            Posez vos questions juridiques et obtenez des reponses instantanees
          </p>
        </div>
      </div>
    );
  }

  if (normalizedQuery && filteredMessages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#e5dbd8] bg-white/70 px-4 py-5 text-center">
        <p className="text-[12px] font-medium text-[#403633]">Aucun resultat dans cette conversation</p>
        <p className="mt-1 text-[11px] leading-5 text-[#857976]">
          Essayez un autre mot-cle pour retrouver une information dans les messages utilisateur et assistant.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {filteredMessages.map((message) => (
        <MessageBubble key={message._id} message={message} searchQuery={searchQuery} onFeedback={onFeedback} />
      ))}
    </div>
  );
}
