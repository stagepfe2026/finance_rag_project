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
      <aside className="flex h-full min-h-0 items-center justify-between gap-2 overflow-hidden rounded-xl border border-[#ece1de] bg-white px-3 shadow-sm lg:flex-col lg:justify-start lg:px-0 lg:py-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#273043] transition hover:bg-slate-100"
          aria-label="Ouvrir l historique des conversations"
          title="Ouvrir l historique"
        >
          <PanelLeftOpen size={18} />
        </button>
        <div className="flex items-center gap-2 lg:flex-col">
          <button
            type="button"
            onClick={onCreateConversation}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#273043] text-white transition hover:bg-[#10106f]"
            aria-label="Nouvelle conversation"
            title="Nouvelle conversation"
          >
            <Plus size={17} />
          </button>
          <button
            type="button"
            onClick={onOpenArchiveModal}
            className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#273043] transition hover:bg-slate-100"
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
      <aside className="flex h-full w-[280px] flex-col overflow-hidden rounded-xl border border-[#ece1de] bg-white shadow-sm">
        <div className="px-5 pb-4 pt-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#273043]">Historique des conversations</h2>
          <div className="flex items-center gap-2">
            
            <button
              type="button"
              onClick={onToggle}
              className=" cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center"
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
          className="mt-4 flex cursor-pointer h-8 w-full items-center justify-center gap-3 rounded-xl border border-[#edf0f7] bg-white px-3 text-[13px] font-semibold text-[#273043] shadow-[0_8px_20px_rgba(39,48,67,0.03)] transition hover:border-[#d8def0] hover:bg-[#fbfcff]"
          aria-label={`Ouvrir les archives (${archivedCount})`}
        >
          <Archive size={16} className="text-[#273043]" />
          Archiver
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="px-5 py-4 text-[12px] text-[#8790ad]">Chargement des conversations...</p>
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

      <div className="p-5 pt-4">
        <NewConversationButton onClick={onCreateConversation} />
      </div>
    </aside>
  );
}
