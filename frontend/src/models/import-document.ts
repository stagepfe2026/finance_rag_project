import { documentCategoryLabels, type DocumentCategoryValue } from "./document";

export type CategoryValue = DocumentCategoryValue;
export type LegalStatusValue = "actif" | "futur" | "remplace" | "abroge";
export type LegalDocumentTypeValue = "loi" | "decret" | "arrete" | "note" | "circulaire" | "autre";
export type LegalRelationTypeValue = "none" | "remplace" | "abroge";

export type CategoryOption = {
  value: CategoryValue;
  label: string;
};

export type SelectOption = {
  value: string;
  label: string;
};

export type PreviewItem = {
  pageNumber: number;
  imageUrl: string;
};

export type StepStatus = "todo" | "current" | "done" | "error";

export type ProgressStep = {
  label: string;
  sub: string;
  status: StepStatus;
};

export type FileMeta = {
  name: string;
  extensionLabel: string;
  sizeLabel: string;
  pageCountLabel: string;
};

export const categoryOptions: CategoryOption[] = [
  { value: "finance", label: documentCategoryLabels.finance },
  { value: "notes", label: documentCategoryLabels.notes },
  { value: "conventions", label: documentCategoryLabels.conventions },
  { value: "recueil", label: documentCategoryLabels.recueil },
  { value: "other", label: documentCategoryLabels.other },
];

export const legalStatusOptions: SelectOption[] = [
  { value: "actif", label: "Actif" },
  { value: "futur", label: "Futur" },
  { value: "remplace", label: "Remplacé" },
  { value: "abroge", label: "Abrogé" },
];

export const legalDocumentTypeOptions: SelectOption[] = [
  { value: "loi", label: "Loi" },
  { value: "decret", label: "Décret" },
  { value: "arrete", label: "Arrêté" },
  { value: "note", label: "Note" },
  { value: "circulaire", label: "Circulaire" },
  { value: "autre", label: "Autre" },
];

export const legalRelationTypeOptions: SelectOption[] = [
  { value: "none", label: "Aucune" },
  { value: "remplace", label: "Remplace" },
  { value: "abroge", label: "Abroge" },
];
