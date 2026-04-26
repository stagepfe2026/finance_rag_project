import emptyChatIllustration from "../../../assets/icons8-bavarder-100.gif";
import type { ChatMessage } from "../../../models/chat";
import MessageBubble from "./MessageBubble";

type MessageListProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  searchQuery?: string;
};

export default function MessageList({ messages, isLoading, searchQuery = "" }: MessageListProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMessages = normalizedQuery
    ? messages.filter((message) => message.content.toLowerCase().includes(normalizedQuery))
    : messages;

  if (isLoading) {
    return <p className="text-[11px] text-[#7f7673]">Chargement des messages...</p>;
  }

  if (messages.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-290px)] items-center justify-center bg-[#fffdfd] px-2 py-6">
        <div className="w-full max-w-[560px] text-center">
          <div className="relative mx-auto flex w-full max-w-[260px] items-center justify-center sm:max-w-[290px]">
            <img
              src={emptyChatIllustration}
              alt="Illustration de bienvenue du chat"
              className="block w-full object-contain drop-shadow-[0_18px_34px_rgba(52,38,46,0.14)]"
            />
          </div>

          <p className="mx-auto mt-4 max-w-[460px] text-[14px] leading-8 text-[#4c648d] sm:text-[15px]">
            Posez une question sur la fiscalite, les lois de finance ou les procedures administratives.
          </p>
        </div>
      </div>
    );
  }

  if (normalizedQuery && filteredMessages.length === 0) {
    return (
      <div className="rounded-[18px] border border-dashed border-[#e5dbd8] bg-white/70 px-4 py-5 text-center">
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
        <MessageBubble key={message._id} message={message} searchQuery={searchQuery} />
      ))}
    </div>
  );
}
