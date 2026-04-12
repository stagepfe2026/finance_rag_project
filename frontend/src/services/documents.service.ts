import type { CategoryValue } from "../models/import-document";
import type {
  DocumentCategoryValue,
  DocumentItem,
  DocumentPreview,
  DocumentsListResponse,
  DocumentStatusValue,
} from "../models/document";

type IndexDocumentInput = {
  apiBaseUrl: string;
  file: File;
  category: CategoryValue;
  title: string;
  description: string;
};

type FetchDocumentsInput = {
  apiBaseUrl: string;
  search?: string;
  category?: DocumentCategoryValue | "all";
  status?: DocumentStatusValue | "all";
  skip?: number;
  limit?: number;
};

type DocumentActionResult = {
  success: boolean;
  message: string;
  data: DocumentItem | null;
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

export async function indexDocument({
  apiBaseUrl,
  file,
  category,
  title,
  description,
}: IndexDocumentInput) {
  const payload = new FormData();
  payload.append("file", file);
  payload.append("category", category);
  payload.append("title", title);
  payload.append("description", description);

  const response = await fetch(`${apiBaseUrl}/api/v1/documents/index`, {
    method: "POST",
    credentials: "include",
    body: payload,
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant l indexation du document."));
  }

  return data;
}

export async function fetchDocuments({
  apiBaseUrl,
  search,
  category = "all",
  status = "all",
  skip = 0,
  limit = 100,
}: FetchDocumentsInput): Promise<DocumentsListResponse> {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("search", search.trim());
  }
  if (category !== "all") {
    params.set("category", category);
  }
  if (status !== "all") {
    params.set("status", status);
  }
  params.set("skip", String(skip));
  params.set("limit", String(limit));

  const query = params.toString();
  const response = await fetch(`${apiBaseUrl}/api/v1/documents${query ? `?${query}` : ""}`, {
    credentials: "include",
  });
  const data = (await parseJson(response)) as DocumentsListResponse | { detail?: string } | null;

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant le chargement des documents."));
  }

  const listData = data as DocumentsListResponse | null;

  return {
    items: Array.isArray(listData?.items) ? (listData.items as DocumentItem[]) : [],
    total: typeof listData?.total === "number" ? listData.total : 0,
  };
}

export async function fetchDocumentPreview({
  apiBaseUrl,
  documentId,
}: {
  apiBaseUrl: string;
  documentId: string;
}): Promise<DocumentPreview> {
  const response = await fetch(`${apiBaseUrl}/api/v1/documents/${documentId}/preview`, {
    credentials: "include",
  });
  const data = (await parseJson(response)) as DocumentPreview | { detail?: string } | null;

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant le chargement de l apercu du document."));
  }

  return data as DocumentPreview;
}

export async function deleteDocumentFromIndex({
  apiBaseUrl,
  documentId,
}: {
  apiBaseUrl: string;
  documentId: string;
}): Promise<DocumentActionResult> {
  const response = await fetch(`${apiBaseUrl}/api/v1/documents/${documentId}/index`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = (await parseJson(response)) as DocumentActionResult | { detail?: string } | null;

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant la suppression de l index du document."));
  }

  return data as DocumentActionResult;
}

export async function reindexDocument({
  apiBaseUrl,
  documentId,
}: {
  apiBaseUrl: string;
  documentId: string;
}): Promise<DocumentActionResult> {
  const response = await fetch(`${apiBaseUrl}/api/v1/documents/${documentId}/reindex`, {
    method: "POST",
    credentials: "include",
  });
  const data = (await parseJson(response)) as DocumentActionResult | { detail?: string } | null;

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant la reindexation du document."));
  }

  return data as DocumentActionResult;
}
