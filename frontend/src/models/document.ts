export type DocumentCategoryValue = "finance" | "legal" | "hr" | "compliance" | "other";

export type DocumentStatusValue = "processing" | "indexed" | "failed";

export type DocumentItem = {
  id: string;
  title: string;
  category: DocumentCategoryValue;
  description: string;
  documentStatus: DocumentStatusValue;
  realizedAt: string | null;
  filePath: string;
  fileSize: number;
  fileType: string;
  isFavored: boolean;
  createdAt: string;
  deletedAt: string | null;
  indexedAt: string | null;
  chunksCount: number | null;
  indexError: string | null;
};

export type DocumentsListResponse = {
  items: DocumentItem[];
  total: number;
};

export type DocumentPreview = {
  id: string;
  title: string;
  category: DocumentCategoryValue;
  description: string;
  fileType: string;
  createdAt: string;
  content: string;
};

export const documentCategoryLabels: Record<DocumentCategoryValue, string> = {
  finance: "Loi Finance",
  legal: "Juridique",
  hr: "Ressources Humaines",
  compliance: "Conformite",
  other: "Autre",
};

export const documentStatusLabels: Record<DocumentStatusValue, string> = {
  indexed: "Indexe",
  processing: "En cours",
  failed: "Echoue",
};
