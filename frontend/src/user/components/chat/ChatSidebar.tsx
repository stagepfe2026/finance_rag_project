import { Archive, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";

import type { Conversation } from "../../../models/chat";
import ConversationList from "./ConversationList";
import NewConversationButton from "./NewConversationButton";
import SidebarSearch from "./SidebarSearch";

type ChatSidebarProps = {
  isOpen: boolean;
  activeConversations: Conversation[];
  selectedConversationId: string | null;
  search: string;
  isLoading: boolean;
  archivedCount: number;
  onToggle: () => void;
  onSearchChange: (value: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onOpenArchiveModal: () => void;
  onCreateConversation: () => void;
  onRenameConversation: (conversation: Conversation) => void;
  onArchiveConversation: (conversation: Conversation) => void;
  onRestoreConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversation: Conversation) => void;
};

export default function ChatSidebar({
  isOpen,
  activeConversations,
  selectedConversationId,
  search,
  isLoading,
  archivedCount,
  onToggle,
  onSearchChange,
  onSelectConversation,
  onOpenArchiveModal,
  onCreateConversation,
  onRenameConversation,
  onArchiveConversation,
  onRestoreConversation,
  onDeleteConversation,
}: ChatSidebarProps) {
  if (!isOpen) {
    return (
      <aside className="flex h-full min-h-0 items-center justify-between gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white px-2 lg:flex-col lg:justify-start lg:px-0 lg:py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#273043] transition hover:bg-slate-100"
          aria-label="Ouvrir l historique des conversations"
          title="Ouvrir l historique"
        >
          <PanelLeftOpen size={18} />
        </button>
        <div className="flex items-center gap-2 lg:flex-col">
          <button
            type="button"
            onClick={onCreateConversation}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md bg-[#273043] text-white transition hover:bg-[#1f2636]"
            aria-label="Nouvelle conversation"
            title="Nouvelle conversation"
          >
            <Plus size={17} />
          </button>
          <button
            type="button"
            onClick={onOpenArchiveModal}
            className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#273043] transition hover:bg-slate-100"
            aria-label={`Ouvrir les archives (${archivedCount})`}
            title="Archiver"
          >
            <Archive size={15} />
            {archivedCount > 0 ? (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#9d0208]" />
            ) : null}
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[248px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-3.5 py-3">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#273043]">Historique</h2>
          <div className="flex items-center gap-2">
            
            <button
              type="button"
              onClick={onToggle}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#273043] transition hover:bg-slate-100"
              aria-label="Fermer l historique des conversations"
              title="Fermer l historique"
            >
              <PanelLeftClose size={17} />
            </button>
          </div>
        </div>

        <SidebarSearch value={search} onChange={onSearchChange} />

        <button
          type="button"
          onClick={onOpenArchiveModal}
          className="mt-2.5 flex h-8 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-[12px] font-semibold text-[#273043] transition hover:border-[#9d0208] hover:bg-white"
          aria-label={`Ouvrir les archives (${archivedCount})`}
        >
          <Archive size={14} className="text-[#273043]" />
          Archives
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="px-4 py-3 text-[12px] text-slate-500">Chargement des conversations...</p>
        ) : (
          <div className="pb-2">
            <ConversationList
              emptyMessage="Aucune conversation active pour le moment."
              conversations={activeConversations}
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

      <div className="border-t border-slate-200 bg-slate-50 p-3">
        <NewConversationButton onClick={onCreateConversation} />
      </div>
    </aside>
  );
}
