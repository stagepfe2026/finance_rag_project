import type { Reclamation } from "../models/reclamation";

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
  }

  if (typeof data === "object" && data && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
}

export async function resolveReclamationAsAdmin(reclamationId: string, adminReply: string): Promise<Reclamation> {
  const response = await fetch(`${apiBaseUrl}/api/v1/reclamations/${reclamationId}/resolve`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ adminReply }),
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Impossible de resoudre la reclamation."));
  }

  return (data as { data: Reclamation }).data;
}
