import type { NotificationSocketEvent, NotificationsResponse } from "../models/notification";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function parseJson(response: Response) {
  return response.json().catch(() => null);
}

function readErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      return "Parametres de notification invalides.";
    }
  }

  return fallback;
}

export async function fetchNotifications(limit = 20): Promise<NotificationsResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/notifications?limit=${limit}`, {
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant le chargement des notifications."));
  }

  return data as NotificationsResponse;
}

export async function markNotificationAsRead(notificationId: string) {
  const response = await fetch(`${apiBaseUrl}/api/v1/notifications/${notificationId}/read`, {
    method: "POST",
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Impossible de marquer la notification comme lue."));
  }

  return data;
}

export function createNotificationsWebSocket(
  handlers: {
    onNotification: (event: NotificationSocketEvent) => void;
    onError?: () => void;
  },
) {
  const wsUrl = apiBaseUrl.replace(/^http/i, "ws");
  const socket = new WebSocket(`${wsUrl}/api/v1/notifications/ws`);

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as NotificationSocketEvent;
      if (payload?.event === "notification.created") {
        handlers.onNotification(payload);
      }
    } catch {
      handlers.onError?.();
    }
  };

  socket.onerror = () => {
    handlers.onError?.();
  };

  return socket;
}
