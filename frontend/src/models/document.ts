export type DocumentCategoryValue = "finance" | "notes" | "conventions" | "recueil" | "other";

export type DocumentStatusValue = "processing" | "indexed" | "failed";
export type LegalStatusValue = "en_vigueur" | "modifie" | "remplace" | "abroge" | "inconnu";
export type LegalDocumentTypeValue = "loi" | "decret" | "arrete" | "note" | "circulaire" | "autre";
export type LegalRelationTypeValue = "none" | "remplace" | "modifie" | "abroge";

export type DocumentItem = {
  id: string;
  title: string;
  category: DocumentCategoryValue;
  description: string;
  documentStatus: DocumentStatusValue;
  legalStatus: LegalStatusValue;
  documentType: LegalDocumentTypeValue;
  realizedAt: string | null;
  datePublication: string | null;
  dateEntreeVigueur: string | null;
  version: string;
  relationType: LegalRelationTypeValue;
  relatedDocumentId: string | null;
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
  legalStatus: LegalStatusValue;
  documentType: LegalDocumentTypeValue;
  datePublication: string | null;
  dateEntreeVigueur: string | null;
  version: string;
  relationType: LegalRelationTypeValue;
  relatedDocumentId: string | null;
  fileType: string;
  createdAt: string;
  content: string;
};

export type DocumentSearchItem = {
  id: string;
  title: string;
  category: DocumentCategoryValue;
  description: string;
  realizedAt: string | null;
  legalStatus: LegalStatusValue;
  documentType: LegalDocumentTypeValue;
  datePublication: string | null;
  dateEntreeVigueur: string | null;
  version: string;
  relationType: LegalRelationTypeValue;
  relatedDocumentId: string | null;
  createdAt: string;
  isFavored: boolean;
  snippets: string[];
};

export type DocumentSearchResponse = {
  items: DocumentSearchItem[];
  total: number;
};

export const documentCategoryLabels: Record<DocumentCategoryValue, string> = {
  finance: "Lois des finances",
  notes: "Notes communes",
  conventions: "Conventions de non double imposition",
  recueil: "Recueils de textes fiscaux",
  other: "Autre documentation utile",
};

export const documentStatusLabels: Record<DocumentStatusValue, string> = {
  indexed: "Indexe",
  processing: "En cours",
  failed: "Echoue",
};

export const legalStatusLabels: Record<LegalStatusValue, string> = {
  en_vigueur: "En vigueur",
  modifie: "Modifie",
  remplace: "Remplace",
  abroge: "Abroge",
  inconnu: "Inconnu",
};

export const legalDocumentTypeLabels: Record<LegalDocumentTypeValue, string> = {
  loi: "Loi",
  decret: "Decret",
  arrete: "Arrete",
  note: "Note",
  circulaire: "Circulaire",
  autre: "Autre",
};

export const legalRelationTypeLabels: Record<LegalRelationTypeValue, string> = {
  none: "Aucune relation",
  remplace: "Remplace",
  modifie: "Modifie",
  abroge: "Abroge",
};
