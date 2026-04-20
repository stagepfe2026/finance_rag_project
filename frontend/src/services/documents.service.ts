import type { CategoryValue } from "../models/import-document";
import type {
  DocumentCategoryValue,
  DocumentItem,
  LegalDocumentTypeValue,
  LegalRelationTypeValue,
  LegalStatusValue,
  DocumentPreview,
  DocumentSearchResponse,
  DocumentsListResponse,
  DocumentStatusValue,
} from "../models/document";

type IndexDocumentInput = {
  apiBaseUrl: string;
  file: File;
  category: CategoryValue;
  title: string;
  description: string;
  legalStatus?: LegalStatusValue;
  documentType?: LegalDocumentTypeValue;
  datePublication?: string;
  dateEntreeVigueur?: string;
  version?: string;
  relationType?: LegalRelationTypeValue;
  relatedDocumentId?: string;
};

type FetchDocumentsInput = {
  apiBaseUrl: string;
  search?: string;
  category?: DocumentCategoryValue | "all";
  status?: DocumentStatusValue | "all";
  skip?: number;
  limit?: number;
};

type SearchDocumentsInput = {
  apiBaseUrl: string;
  query?: string;
  title?: string;
  categories?: DocumentCategoryValue[];
  dateFrom?: string;
  dateTo?: string;
  favoritesOnly?: boolean;
  sortBy?: "recent" | "title";
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
  legalStatus,
  documentType,
  datePublication,
  dateEntreeVigueur,
  version,
  relationType,
  relatedDocumentId,
}: IndexDocumentInput) {
  const payload = new FormData();
  payload.append("file", file);
  payload.append("category", category);
  payload.append("title", title);
  payload.append("description", description);
  if (legalStatus) {
    payload.append("legal_status", legalStatus);
  }
  if (documentType) {
    payload.append("document_type", documentType);
  }
  if (datePublication) {
    payload.append("date_publication", datePublication);
  }
  if (dateEntreeVigueur) {
    payload.append("date_entree_vigueur", dateEntreeVigueur);
  }
  if (version?.trim()) {
    payload.append("version", version.trim());
  }
  if (relationType) {
    payload.append("relation_type", relationType);
  }
  if (relatedDocumentId?.trim()) {
    payload.append("related_document_id", relatedDocumentId.trim());
  }

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

export async function searchDocuments({
  apiBaseUrl,
  query,
  title,
  categories = [],
  dateFrom,
  dateTo,
  favoritesOnly = false,
  sortBy = "recent",
  skip = 0,
  limit = 50,
}: SearchDocumentsInput): Promise<DocumentSearchResponse> {
  const params = new URLSearchParams();

  if (query?.trim()) {
    params.set("query", query.trim());
  }
  if (title?.trim()) {
    params.set("title", title.trim());
  }
  categories.forEach((category) => params.append("categories", category));
  if (dateFrom) {
    params.set("date_from", dateFrom);
  }
  if (dateTo) {
    params.set("date_to", dateTo);
  }
  if (favoritesOnly) {
    params.set("favorites_only", "true");
  }
  params.set("sort_by", sortBy);
  params.set("skip", String(skip));
  params.set("limit", String(limit));

  const response = await fetch(`${apiBaseUrl}/api/v1/document-search?${params.toString()}`, {
    credentials: "include",
  });
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant la recherche des documents."));
  }

  const payload = data as DocumentSearchResponse | null;
  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
    total: typeof payload?.total === "number" ? payload.total : 0,
  };
}

export async function fetchUserDocumentPreview({
  apiBaseUrl,
  documentId,
}: {
  apiBaseUrl: string;
  documentId: string;
}): Promise<DocumentPreview> {
  const response = await fetch(`${apiBaseUrl}/api/v1/document-search/${documentId}/preview`, {
    credentials: "include",
  });
  const data = (await parseJson(response)) as DocumentPreview | { detail?: string } | null;

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant le chargement de l apercu du document."));
  }

  return data as DocumentPreview;
}

export async function setDocumentFavorite({
  apiBaseUrl,
  documentId,
  isFavored,
}: {
  apiBaseUrl: string;
  documentId: string;
  isFavored: boolean;
}): Promise<DocumentActionResult> {
  const response = await fetch(`${apiBaseUrl}/api/v1/document-search/${documentId}/favorite`, {
    method: isFavored ? "POST" : "DELETE",
    credentials: "include",
  });
  const data = (await parseJson(response)) as DocumentActionResult | { detail?: string } | null;

  if (!response.ok) {
    throw new Error(readErrorMessage(data, "Erreur pendant la mise a jour du favori."));
  }

  return data as DocumentActionResult;
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
