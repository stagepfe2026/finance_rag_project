import type { UserDashboard } from "../models/dashboard";

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

export async function fetchUserDashboard(): Promise<UserDashboard> {
  const response = await fetch(`${apiBaseUrl}/api/v1/dashboard/user-home`, {
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant le chargement du tableau de bord."));
  }

  return data as UserDashboard;
}
