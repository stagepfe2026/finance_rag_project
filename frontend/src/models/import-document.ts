export type CategoryValue = "finance" | "legal" | "hr" | "compliance" | "other";

export type CategoryOption = {
  value: CategoryValue;
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
