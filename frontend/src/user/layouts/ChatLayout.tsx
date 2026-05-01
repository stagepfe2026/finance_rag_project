import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { ChatFeedback, ChatMessage, Conversation, ResponseMode } from "../../models/chat";
import {
  archiveConversation,
  askChatQuestion,
  createConversation,
  deleteConversation,
  fetchConversationMessages,
  fetchConversations,
  renameConversation,
  restoreConversation,
  submitChatFeedback,
} from "../../services/chat.service";
import ChatMain from "../components/chat/ChatMain";
import ArchivedConversationsModal from "../components/chat/ArchivedConversationsModal";
import ConversationActionModal from "../components/chat/ConversationActionModal";
import ChatSidebar from "../components/chat/ChatSidebar";
import Snackbar from "../components/chat/Snackbar";

function upsertConversation(list: Conversation[], nextConversation: Conversation) {
  const remaining = list.filter((item) => item._id !== nextConversation._id);
  return [nextConversation, ...remaining];
}

function buildTemporaryMessage(input: {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}): ChatMessage {
  return {
    _id: input.id,
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    createdAt: new Date().toISOString(),
    sources: [],
    pending: input.pending ?? false,
  };
}

function getNextSelectedConversationId(
  conversations: Conversation[],
  removedConversationId?: string,
  currentSelectedId?: string | null,
) {
  if (
    currentSelectedId &&
    currentSelectedId !== removedConversationId &&
    conversations.some((item) => item._id === currentSelectedId)
  ) {
    return currentSelectedId;
  }

  return conversations.find((item) => !item.isArchived)?._id ?? conversations[0]?._id ?? null;
}

type SnackbarState = {
  open: boolean;
  message: string;
  tone: "success" | "error" | "info";
};

type ConversationModalState = {
  mode: "rename" | "archive" | "delete" | null;
  conversation: Conversation | null;
  busy: boolean;
};

export default function ChatLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialActionHandledRef = useRef(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [responseMode, setResponseMode] = useState<ResponseMode>("detailed");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", tone: "info" });
  const [conversationModal, setConversationModal] = useState<ConversationModalState>({
    mode: null,
    conversation: null,
    busy: false,
  });
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [restoringConversationId, setRestoringConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!snackbar.open) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSnackbar((current) => ({ ...current, open: false }));
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [snackbar.open, snackbar.message]);

  function showSnackbar(message: string, tone: SnackbarState["tone"] = "info") {
    setSnackbar({ open: true, message, tone });
  }

  function openConversationModal(mode: ConversationModalState["mode"], conversation: Conversation) {
    setConversationModal({ mode, conversation, busy: false });
  }

  function closeConversationModal() {
    setConversationModal({ mode: null, conversation: null, busy: false });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      setIsLoadingConversations(true);
      setPageError("");

      try {
        const data = await fetchConversations();
        if (!cancelled) {
          setConversations(data);
          setSelectedConversationId((current) => getNextSelectedConversationId(data, undefined, current));
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(error instanceof Error ? error.message : "Erreur pendant le chargement des conversations.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingConversations(false);
        }
      }
    }

    void loadConversations();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoadingConversations || initialActionHandledRef.current) {
      return;
    }

    const requestedConversationId = searchParams.get("conversationId");
    const wantsNewConversation = searchParams.get("new") === "1";

    if (requestedConversationId && conversations.some((item) => item._id === requestedConversationId)) {
      setSelectedConversationId(requestedConversationId);
      initialActionHandledRef.current = true;
      return;
    }

    if (!wantsNewConversation) {
      initialActionHandledRef.current = true;
      return;
    }

    initialActionHandledRef.current = true;

    void (async () => {
      try {
        const conversation = await createConversation();
        setConversations((current) => upsertConversation(current, conversation));
        setSelectedConversationId(conversation._id);
        setMessages([]);
        setSearchParams({ conversationId: conversation._id }, { replace: true });
        showSnackbar("Conversation creee avec succes.", "success");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Impossible de creer une conversation.";
        setPageError(message);
        showSnackbar(message, "error");
      }
    })();
  }, [conversations, isLoadingConversations, searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    const conversationId = selectedConversationId;
    let cancelled = false;

    async function loadMessages() {
      setIsLoadingMessages(true);
      setPageError("");

      try {
        const data = await fetchConversationMessages(conversationId);
        if (!cancelled) {
          setMessages(data);
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(error instanceof Error ? error.message : "Erreur pendant le chargement des messages.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMessages(false);
        }
      }
    }

    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return conversations;
    }

    return conversations.filter((conversation) => conversation.summary.toLowerCase().includes(keyword));
  }, [conversations, search]);

  const activeConversations = filteredConversations.filter((conversation) => !conversation.isArchived);
  const archivedConversations = conversations.filter((conversation) => conversation.isArchived);
  const selectedConversation = conversations.find((item) => item._id === selectedConversationId) ?? null;

  async function handleCreateConversation() {
    try {
      setPageError("");
      const conversation = await createConversation();
      setConversations((current) => upsertConversation(current, conversation));
      setSelectedConversationId(conversation._id);
      setMessages([]);
      setSearchParams({ conversationId: conversation._id }, { replace: true });
      showSnackbar("Conversation creee avec succes.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de creer une conversation.";
      setPageError(message);
      showSnackbar(message, "error");
    }
  }

  function handleRenameConversation(conversation: Conversation) {
    openConversationModal("rename", conversation);
  }

  function handleArchiveConversation(conversation: Conversation) {
    openConversationModal("archive", conversation);
  }

  async function handleRestoreConversation(conversation: Conversation) {
    try {
      setRestoringConversationId(conversation._id);
      setPageError("");
      const updated = await restoreConversation(conversation._id);
      setConversations((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setSelectedConversationId(updated._id);
      setSearchParams({ conversationId: updated._id }, { replace: true });
      showSnackbar("Conversation restauree avec succes.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de restaurer la conversation.";
      setPageError(message);
      showSnackbar(message, "error");
    } finally {
      setRestoringConversationId(null);
    }
  }

  function handleDeleteConversation(conversation: Conversation) {
    openConversationModal("delete", conversation);
  }

  async function handleConversationModalConfirm(payload?: { summary: string }) {
    const conversation = conversationModal.conversation;
    const mode = conversationModal.mode;
    if (!conversation || !mode) {
      return;
    }

    try {
      setConversationModal((current) => ({ ...current, busy: true }));
      setPageError("");

      if (mode === "rename") {
        const nextSummary = payload?.summary?.trim() ?? "";
        if (!nextSummary || nextSummary === conversation.summary) {
          closeConversationModal();
          return;
        }
        const updated = await renameConversation(conversation._id, nextSummary);
        setConversations((current) => current.map((item) => (item._id === updated._id ? updated : item)));
        showSnackbar("Conversation renommee avec succes.", "success");
      }

      if (mode === "archive") {
        const updated = await archiveConversation(conversation._id);
        setConversations((current) => current.map((item) => (item._id === updated._id ? updated : item)));
        if (selectedConversationId === conversation._id) {
          const nextConversations = conversations.map((item) => (item._id === updated._id ? updated : item));
          const nextSelectedId = getNextSelectedConversationId(nextConversations, updated._id, selectedConversationId);
          setSelectedConversationId(nextSelectedId);
          if (nextSelectedId) {
            setSearchParams({ conversationId: nextSelectedId }, { replace: true });
          }
        }
        showSnackbar("Conversation archivee avec succes.", "success");
      }

      if (mode === "delete") {
        await deleteConversation(conversation._id);
        const remaining = conversations.filter((item) => item._id !== conversation._id);
        const nextSelectedId = getNextSelectedConversationId(remaining, conversation._id, selectedConversationId);
        setConversations(remaining);
        setSelectedConversationId(nextSelectedId);
        if (selectedConversationId === conversation._id) {
          setMessages([]);
        }
        if (nextSelectedId) {
          setSearchParams({ conversationId: nextSelectedId }, { replace: true });
        }
        showSnackbar("Conversation supprimee avec succes.", "success");
      }

      closeConversationModal();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : mode === "rename"
            ? "Impossible de renommer la conversation."
            : mode === "archive"
              ? "Impossible d archiver la conversation."
              : "Impossible de supprimer la conversation.";
      setPageError(message);
      showSnackbar(message, "error");
      setConversationModal((current) => ({ ...current, busy: false }));
    }
  }

  async function handleSendMessage(content: string) {
    const baseConversationId = selectedConversationId ?? `temp-conversation-${Date.now()}`;
    const tempUserMessage = buildTemporaryMessage({
      id: `temp-user-${Date.now()}`,
      conversationId: baseConversationId,
      role: "user",
      content,
    });
    const tempAssistantMessage = buildTemporaryMessage({
      id: `temp-assistant-${Date.now()}`,
      conversationId: baseConversationId,
      role: "assistant",
      content: responseMode === "short" ? "L assistant prepare une reponse courte..." : "L assistant prepare une reponse detaillee...",
      pending: true,
    });

    setMessages((current) => [...current, tempUserMessage, tempAssistantMessage]);

    try {
      setIsSubmitting(true);
      setPageError("");

      const result = await askChatQuestion({
        content,
        conversationId: selectedConversationId,
        responseMode,
      });

      setConversations((current) => upsertConversation(current, result.conversation));
      setSelectedConversationId(result.conversation._id);
      setSearchParams({ conversationId: result.conversation._id }, { replace: true });
      setMessages((current) => {
        const withoutTemps = current.filter(
          (message) => message._id !== tempUserMessage._id && message._id !== tempAssistantMessage._id,
        );
        return [...withoutTemps, result.userMessage, result.assistantMessage];
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d envoyer le message.";
      setMessages((current) =>
        current.map((item) =>
          item._id === tempAssistantMessage._id
            ? {
                ...item,
                content: message,
                sources: [],
                pending: false,
              }
            : item,
        ),
      );
      setPageError(message);
      showSnackbar(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMessageFeedback(messageId: string, feedback: ChatFeedback) {
    const targetMessage = messages.find((message) => message._id === messageId);
    if (!targetMessage || targetMessage.role !== "assistant" || targetMessage.pending) {
      return;
    }

    const previousFeedback = targetMessage.feedback ?? null;
    const nextFeedback = previousFeedback === feedback ? null : feedback;

    setMessages((current) =>
      current.map((message) => (message._id === messageId ? { ...message, feedback: nextFeedback } : message)),
    );

    try {
      const updatedMessage = await submitChatFeedback(messageId, nextFeedback);
      setMessages((current) =>
        current.map((message) => (message._id === messageId ? { ...message, ...updatedMessage } : message)),
      );
      showSnackbar(nextFeedback ? "Avis enregistre." : "Avis retire.", "success");
    } catch (error) {
      setMessages((current) =>
        current.map((message) => (message._id === messageId ? { ...message, feedback: previousFeedback } : message)),
      );
      showSnackbar(error instanceof Error ? error.message : "Impossible d enregistrer l avis.", "error");
    }
  }

  return (
    <>
      <div className="h-[calc(100vh-81px)] w-full overflow-hidden bg-slate-50 px-3 py-3 md:px-4">
        <div
         className="flex h-full min-h-0 gap-4 overflow-hidden"
        >
          
          <ChatSidebar
            isOpen={isHistoryOpen}
            activeConversations={activeConversations}
            selectedConversationId={selectedConversationId}
            search={search}
            isLoading={isLoadingConversations}
            archivedCount={archivedConversations.length}
            onToggle={() => setIsHistoryOpen((current) => !current)}
            onSearchChange={setSearch}
            onSelectConversation={(conversationId) => {
              setSelectedConversationId(conversationId);
              if (conversationId) {
                setSearchParams({ conversationId }, { replace: true });
              }
            }}
            onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
            onCreateConversation={handleCreateConversation}
            onRenameConversation={handleRenameConversation}
            onArchiveConversation={handleArchiveConversation}
            onRestoreConversation={handleRestoreConversation}
            onDeleteConversation={handleDeleteConversation}
          />
          <div className="min-w-0 flex-1">

          <ChatMain
            conversation={selectedConversation}
            messages={messages}
            isLoading={isLoadingMessages}
            isSubmitting={isSubmitting}
            error={pageError}
            responseMode={responseMode}
            onResponseModeChange={setResponseMode}
            onSubmit={handleSendMessage}
            onFeedback={handleMessageFeedback}
            onNotify={showSnackbar}
          />
        </div>
      </div>
</div>
      <ConversationActionModal
        mode={conversationModal.mode}
        conversation={conversationModal.conversation}
        open={Boolean(conversationModal.mode && conversationModal.conversation)}
        busy={conversationModal.busy}
        onClose={closeConversationModal}
        onConfirm={handleConversationModalConfirm}
      />
      <ArchivedConversationsModal
        open={isArchiveModalOpen}
        conversations={archivedConversations}
        busyConversationId={restoringConversationId}
        onClose={() => setIsArchiveModalOpen(false)}
        onRestore={handleRestoreConversation}
      />
      <Snackbar open={snackbar.open} message={snackbar.message} tone={snackbar.tone} />
    </>
  );
}
