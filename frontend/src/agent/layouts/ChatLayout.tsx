import { useOutletContext } from "react-router-dom";
import type { UserLayoutContextValue } from "./AgentLayout";
import { useChatViewModel } from "../viewmodels/useChatViewModel";
import ChatMain from "../components/chat/ChatMain";
import ArchivedConversationsModal from "../components/chat/ArchivedConversationsModal";
import ConversationActionModal from "../components/chat/ConversationActionModal";
import ChatSidebar from "../components/chat/ChatSidebar";
import Snackbar from "../components/chat/Snackbar";

export default function ChatLayout() {
  const { registerGeneratingMessage } = useOutletContext<UserLayoutContextValue>();
  const vm = useChatViewModel(registerGeneratingMessage);

  return (
    <>
      <div className="h-[calc(100vh-81px)] w-full overflow-hidden bg-slate-50 px-3 py-3">
        <div className="flex h-full min-h-0 gap-3 overflow-hidden">
          <ChatSidebar
            isOpen={vm.isHistoryOpen}
            activeConversations={vm.activeConversations}
            selectedConversationId={vm.selectedConversationId}
            search={vm.search}
            isLoading={vm.isLoadingConversations}
            archivedCount={vm.archivedConversations.length}
            onToggle={vm.handleToggleHistory}
            onSearchChange={vm.setSearch}
            onSelectConversation={vm.handleSelectConversation}
            onOpenArchiveModal={vm.handleOpenArchiveModal}
            onCreateConversation={vm.handleCreateConversation}
            onRenameConversation={vm.handleRenameConversation}
            onArchiveConversation={vm.handleArchiveConversation}
            onRestoreConversation={vm.handleRestoreConversation}
            onDeleteConversation={vm.handleDeleteConversation}
          />
          <div className="min-w-0 flex-1">
            <ChatMain
              conversation={vm.selectedConversation}
              messages={vm.messages}
              isLoading={vm.isLoadingMessages}
              isSubmitting={vm.isSubmitting}
              error={vm.pageError}
              responseMode={vm.responseMode}
              onResponseModeChange={vm.setResponseMode}
              onSubmit={vm.handleSendMessage}
              onFeedback={vm.handleMessageFeedback}
              onNotify={vm.showSnackbar}
            />
          </div>
        </div>
      </div>

      <ConversationActionModal
        mode={vm.conversationModal.mode}
        conversation={vm.conversationModal.conversation}
        open={Boolean(vm.conversationModal.mode && vm.conversationModal.conversation)}
        busy={vm.conversationModal.busy}
        onClose={vm.closeConversationModal}
        onConfirm={vm.handleConversationModalConfirm}
      />
      <ArchivedConversationsModal
        open={vm.isArchiveModalOpen}
        conversations={vm.archivedConversations}
        busyConversationId={vm.restoringConversationId}
        onClose={vm.handleCloseArchiveModal}
        onRestore={vm.handleRestoreConversation}
      />
      <Snackbar open={vm.snackbar.open} message={vm.snackbar.message} tone={vm.snackbar.tone} />
    </>
  );
}
