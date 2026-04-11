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
    body: payload,
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message = data?.detail || data?.message || "Erreur pendant l indexation du document.";
    throw new Error(message);
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
  const response = await fetch(`${apiBaseUrl}/api/v1/documents${query ? `?${query}` : ""}`);
  const data = (await parseJson(response)) as DocumentsListResponse | { detail?: string } | null;

  if (!response.ok) {
    const message = data && "detail" in data && data.detail
      ? data.detail
      : "Erreur pendant le chargement des documents.";
    throw new Error(message);
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
  const response = await fetch(`${apiBaseUrl}/api/v1/documents/${documentId}/preview`);
  const data = (await parseJson(response)) as DocumentPreview | { detail?: string } | null;

  if (!response.ok) {
    const message = data && "detail" in data && data.detail
      ? data.detail
      : "Erreur pendant le chargement de l apercu du document.";
    throw new Error(message);
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
  });
  const data = (await parseJson(response)) as DocumentActionResult | { detail?: string } | null;

  if (!response.ok) {
    const message = data && "detail" in data && data.detail
      ? data.detail
      : "Erreur pendant la suppression de l index du document.";
    throw new Error(message);
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
  });
  const data = (await parseJson(response)) as DocumentActionResult | { detail?: string } | null;

  if (!response.ok) {
    const message = data && "detail" in data && data.detail
      ? data.detail
      : "Erreur pendant la reindexation du document.";
    throw new Error(message);
  }

  return data as DocumentActionResult;
}
