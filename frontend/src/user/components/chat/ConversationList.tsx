import type { Conversation } from "../../../models/chat";
import ConversationItem from "./ConversationItem";

type ConversationListProps = {
  title?: string;
  emptyMessage: string;
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onRenameConversation: (conversation: Conversation) => void;
  onArchiveConversation: (conversation: Conversation) => void;
  onRestoreConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversation: Conversation) => void;
};

export default function ConversationList({
  title,
  emptyMessage,
  conversations,
  selectedConversationId,
  onSelectConversation,
  onRenameConversation,
  onArchiveConversation,
  onRestoreConversation,
  onDeleteConversation,
}: ConversationListProps) {
  return (
    <section>
      {title ? (
        <div className="px-5 py-2.5">
          <h2 className="text-[14px] font-semibold text-[#273043]">{title}</h2>
        </div>
      ) : null}

      {conversations.length === 0 ? (
        <p className="px-5 py-4 text-[12px] leading-5 text-[#8790ad]">{emptyMessage}</p>
      ) : (
        <div className="divide-y divide-[#edf0f7]">
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation._id}
              conversation={conversation}
              isActive={conversation._id === selectedConversationId}
              onClick={() => onSelectConversation(conversation._id)}
              onRename={onRenameConversation}
              onArchive={onArchiveConversation}
              onRestore={onRestoreConversation}
              onDelete={onDeleteConversation}
            />
          ))}
        </div>
      )}
    </section>
  );
}
