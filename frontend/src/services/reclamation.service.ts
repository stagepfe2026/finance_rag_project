import type { CreateReclamationInput, Reclamation } from "../models/reclamation";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type ReclamationListPayload = {
  items: Reclamation[];
  total: number;
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

export async function fetchReclamations(): Promise<Reclamation[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/reclamations`, {
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant le chargement des reclamations."));
  }

  const payload = (data as ApiEnvelope<ReclamationListPayload>).data;
  return Array.isArray(payload?.items) ? payload.items : [];
}

export async function createReclamation(input: CreateReclamationInput): Promise<Reclamation> {
  const formData = new FormData();
  formData.append("subject", input.subject);
  formData.append("description", input.description);
  formData.append("problem_type", input.problemType);
  formData.append("priority", input.priority);

  if (input.customProblemType) {
    formData.append("custom_problem_type", input.customProblemType);
  }

  if (input.attachment) {
    formData.append("attachment", input.attachment);
  }

  const response = await fetch(`${apiBaseUrl}/api/v1/reclamations`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Impossible d envoyer la reclamation."));
  }

  return (data as ApiEnvelope<Reclamation>).data;
}
