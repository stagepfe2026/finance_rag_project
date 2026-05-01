import type { AskChatResult, ChatFeedback, ChatMessage, Conversation, ResponseMode } from "../models/chat";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

async function parseJson(response: Response) {
  return response.json().catch(() => null);
}

function readErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (typeof detail === "object" && detail && "message" in detail) {
      const message = (detail as { message?: unknown }).message;
      if (typeof message === "string") {
        return message;
      }
    }
  }

  if (typeof data === "object" && data && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
}

function sanitizeFileName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return "source-document";
  }

  return trimmed.replace(/[\\/:*?"<>|]+/g, "-");
}

export async function fetchConversations(): Promise<Conversation[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/conversations`, {
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant le chargement des conversations."));
  }

  return Array.isArray((data as ApiEnvelope<Conversation[]> | null)?.data)
    ? ((data as ApiEnvelope<Conversation[]>).data ?? [])
    : [];
}

export async function createConversation(): Promise<Conversation> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/conversations`, {
    method: "POST",
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Impossible de creer la conversation."));
  }

  return (data as ApiEnvelope<Conversation>).data;
}

export async function renameConversation(conversationId: string, summary: string): Promise<Conversation> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/conversations/${conversationId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ summary }),
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Impossible de renommer la conversation."));
  }

  return (data as ApiEnvelope<Conversation>).data;
}

export async function archiveConversation(conversationId: string): Promise<Conversation> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/conversations/${conversationId}/archive`, {
    method: "POST",
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Impossible d archiver la conversation."));
  }

  return (data as ApiEnvelope<Conversation>).data;
}

export async function restoreConversation(conversationId: string): Promise<Conversation> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/conversations/${conversationId}/restore`, {
    method: "POST",
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Impossible de restaurer la conversation."));
  }

  return (data as ApiEnvelope<Conversation>).data;
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/conversations/${conversationId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const data = await parseJson(response);
    throw new Error(readErrorMessage(data, "Impossible de supprimer la conversation."));
  }
}

export async function fetchConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/conversations/${conversationId}/messages`, {
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant le chargement des messages."));
  }

  return Array.isArray((data as ApiEnvelope<ChatMessage[]> | null)?.data)
    ? ((data as ApiEnvelope<ChatMessage[]>).data ?? [])
    : [];
}

export async function askChatQuestion(input: {
  content: string;
  conversationId?: string | null;
  responseMode: ResponseMode;
}): Promise<AskChatResult> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/ask`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: input.content,
      conversation_id: input.conversationId ?? null,
      response_mode: input.responseMode,
    }),
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Impossible d envoyer le message."));
  }

  return (data as ApiEnvelope<AskChatResult>).data;
}

export async function submitChatFeedback(messageId: string, feedback: ChatFeedback | null): Promise<ChatMessage> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/messages/${messageId}/feedback`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ feedback }),
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Impossible d enregistrer l avis."));
  }

  return (data as ApiEnvelope<ChatMessage>).data;
}

export async function downloadChatSource(documentId: string, fileName: string) {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/sources/${documentId}/download`, {
    credentials: "include",
  });

  if (!response.ok) {
    const data = await parseJson(response);
    throw new Error(readErrorMessage(data, "Impossible de telecharger la source."));
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = sanitizeFileName(fileName);
  link.click();
  URL.revokeObjectURL(downloadUrl);
}
