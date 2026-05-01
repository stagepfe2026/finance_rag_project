import type { ChatFeedbackStats } from "../models/chat-feedback";

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

export async function fetchChatFeedbackStats(): Promise<ChatFeedbackStats> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/feedback/stats`, {
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Impossible de charger les avis chat."));
  }

  return (data as ApiEnvelope<ChatFeedbackStats>).data;
}
