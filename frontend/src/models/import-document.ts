export type CategoryValue = "finance" | "legal" | "hr" | "compliance" | "other";
export type LegalStatusValue = "en_vigueur" | "modifie" | "remplace" | "abroge" | "inconnu";
export type LegalDocumentTypeValue = "loi" | "decret" | "arrete" | "note" | "circulaire" | "autre";
export type LegalRelationTypeValue = "none" | "remplace" | "modifie" | "abroge";

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
  { value: "finance", label: "Loi Finance" },
  { value: "legal", label: "Juridique" },
  { value: "hr", label: "Ressources Humaines" },
  { value: "compliance", label: "Conformité" },
  { value: "other", label: "Autre" },
];

export const legalStatusOptions: SelectOption[] = [
  { value: "en_vigueur", label: "En vigueur" },
  { value: "modifie", label: "Modifié" },
  { value: "remplace", label: "Remplacé" },
  { value: "abroge", label: "Abrogé" },
  { value: "inconnu", label: "Inconnu" },
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
  { value: "modifie", label: "Modifie" },
  { value: "abroge", label: "Abroge" },
];
