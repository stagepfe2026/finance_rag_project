import type { Conversation } from "../../../models/chat";
import ConversationList from "./ConversationList";
import NewConversationButton from "./NewConversationButton";
import SidebarSearch from "./SidebarSearch";

type ChatSidebarProps = {
  activeConversations: Conversation[];
  archivedConversations: Conversation[];
  selectedConversationId: string | null;
  search: string;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: () => void;
  onRenameConversation: (conversation: Conversation) => void;
  onArchiveConversation: (conversation: Conversation) => void;
  onRestoreConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversation: Conversation) => void;
};

export default function ChatSidebar({
  activeConversations,
  archivedConversations,
  selectedConversationId,
  search,
  isLoading,
  onSearchChange,
  onSelectConversation,
  onCreateConversation,
  onRenameConversation,
  onArchiveConversation,
  onRestoreConversation,
  onDeleteConversation,
}: ChatSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-b border-[#eee7e5] bg-[linear-gradient(180deg,#fbf9f8_0%,#f6f2f1_100%)] lg:border-b-0 lg:border-r">
      <div className="border-b border-[#eee7e5] px-3 py-3">
        <SidebarSearch value={search} onChange={onSearchChange} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-3">
        {isLoading ? (
          <p className="px-3 py-2 text-[12px] text-[#7f7673]">Chargement des conversations...</p>
        ) : (
          <div className="space-y-3 pt-1">
            <ConversationList
              title="Historique"
              emptyMessage="Aucune conversation active pour le moment."
              conversations={activeConversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={onSelectConversation}
              onRenameConversation={onRenameConversation}
              onArchiveConversation={onArchiveConversation}
              onRestoreConversation={onRestoreConversation}
              onDeleteConversation={onDeleteConversation}
            />

            <ConversationList
              title="Archives"
              emptyMessage="Aucune conversation archivee."
              conversations={archivedConversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={onSelectConversation}
              onRenameConversation={onRenameConversation}
              onArchiveConversation={onArchiveConversation}
              onRestoreConversation={onRestoreConversation}
              onDeleteConversation={onDeleteConversation}
            />
          </div>
        )}
      </div>

      <div className="border-t border-[#eee7e5] p-4">
        <NewConversationButton onClick={onCreateConversation} />
      </div>
    </aside>
  );
}
