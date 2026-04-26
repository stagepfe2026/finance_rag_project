import type { AuditActivitiesPayload } from "../models/audit";

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

type FetchAuditActivitiesFilters = {
  userId?: string;
  actionType?: string;
  search?: string;
  limit?: number;
};

export async function fetchAuditActivities(
  filters: FetchAuditActivitiesFilters = {},
): Promise<AuditActivitiesPayload> {
  const params = new URLSearchParams();

  if (filters.userId?.trim()) {
    params.set("userId", filters.userId.trim());
  }
  if (filters.actionType?.trim()) {
    params.set("actionType", filters.actionType.trim());
  }
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }
  params.set("limit", String(filters.limit ?? 250));

  const query = params.toString();
  const response = await fetch(`${apiBaseUrl}/api/v1/audit${query ? `?${query}` : ""}`, {
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant le chargement de l audit."));
  }

  return (data as ApiEnvelope<AuditActivitiesPayload>).data;
}
