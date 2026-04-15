import type { Conversation } from "../../../models/chat";
import ConversationItem from "./ConversationItem";

type ConversationListProps = {
  title: string;
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
      <div className="px-3 py-2.5">
        <h2 className="text-[14px] font-semibold text-[#3a2f2c]">{title}</h2>
      </div>

      {conversations.length === 0 ? (
        <p className="px-3 py-2 text-[12px] text-[#7f7673]">{emptyMessage}</p>
      ) : (
        <div className="divide-y divide-[#e6dedd] border-y border-[#eee7e5] bg-[rgba(255,255,255,0.25)]">
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
