import type { ReactNode } from "react";

import type {
  CategoryOption,
  CategoryValue,
  FileMeta,
  LegalDocumentTypeValue,
  LegalRelationTypeValue,
  SelectOption,
} from "../../../models/import-document";

type RelatedDocumentOption = {
  id: string;
  title: string;
};

type DocumentFormProps = {
  category: CategoryValue;
  categoryOptions: CategoryOption[];
  title: string;
  documentType: LegalDocumentTypeValue;
  documentTypeOptions: SelectOption[];
  datePublication: string;
  dateEntreeVigueur: string;
  version: string;
  relationType: LegalRelationTypeValue;
  relationTypeOptions: SelectOption[];
  relatedDocumentId: string;
  relatedDocumentOptions: RelatedDocumentOption[];
  relationSearch: string;
  errors: Partial<Record<"title" | "documentType" | "datePublication" | "dateEntreeVigueur" | "relatedDocumentId", string>>;
  fileMeta: FileMeta | null;
  onCategoryChange: (value: CategoryValue) => void;
  onTitleChange: (value: string) => void;
  onDocumentTypeChange: (value: LegalDocumentTypeValue) => void;
  onDatePublicationChange: (value: string) => void;
  onDateEntreeVigueurChange: (value: string) => void;
  onVersionChange: (value: string) => void;
  onRelationTypeChange: (value: LegalRelationTypeValue) => void;
  onRelatedDocumentIdChange: (value: string) => void;
  onRelationSearchChange: (value: string) => void;
  onFieldBlur: (field: "title" | "documentType" | "datePublication" | "dateEntreeVigueur" | "relatedDocumentId") => void;
  onClearFile: () => void;
};

function FormField({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold text-[#071f3d]">{label}</label>
      {children}
      {error ? <p className="mt-1 text-[10px] font-semibold text-[#9d0208]">{error}</p> : null}
    </div>
  );
}

export default function DocumentForm({
  category,
  categoryOptions,
  title,
  documentType,
  documentTypeOptions,
  datePublication,
  dateEntreeVigueur,
  version,
  relationType,
  relationTypeOptions,
  relatedDocumentId,
  relatedDocumentOptions,
  relationSearch,
  errors,
  onCategoryChange,
  onTitleChange,
  onDocumentTypeChange,
  onDatePublicationChange,
  onDateEntreeVigueurChange,
  onVersionChange,
  onRelationTypeChange,
  onRelatedDocumentIdChange,
  onRelationSearchChange,
  onFieldBlur,
}: DocumentFormProps) {
  const showRelatedDocument = relationType !== "none";

  return (
    <div className="rounded-lg border border-[#e5eaf2] bg-white">
      <div className="border-b border-[#e5eaf2] px-4 py-2">
        <h2 className="text-sm font-bold text-[#071f3d]">Métadonnées</h2>
      </div>

      <div className="space-y-4 p-4">
        <FormField label="Categorie">
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value as CategoryValue)}
            className="h-9 w-full rounded border border-[#e5eaf2] bg-white px-3 text-[12px] text-[#071f3d] outline-none transition focus:border-[#071f3d]"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Type de document" error={errors.documentType}>
            <select
              value={documentType}
              onChange={(event) => onDocumentTypeChange(event.target.value as LegalDocumentTypeValue)}
              onBlur={() => onFieldBlur("documentType")}
              className="h-9 w-full rounded border border-[#e5eaf2] bg-white px-3 text-[12px] text-[#071f3d] outline-none transition focus:border-[#071f3d]"
            >
              <option value="">Selectionnez un type</option>
              {documentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Titre" error={errors.title}>
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            onBlur={() => onFieldBlur("title")}
            placeholder="Le titre sera rempli automatiquement"
            className="h-9 w-full rounded border border-[#e5eaf2] bg-white px-3 text-[12px] text-[#071f3d] outline-none transition focus:border-[#071f3d]"
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Date de publication" error={errors.datePublication}>
            <input
              type="date"
              value={datePublication}
              onChange={(event) => onDatePublicationChange(event.target.value)}
              onBlur={() => onFieldBlur("datePublication")}
              className="h-9 w-full rounded border border-[#e5eaf2] bg-white px-3 text-[12px] text-[#071f3d] outline-none transition focus:border-[#071f3d]"
            />
          </FormField>

          <FormField label="Date d entree en vigueur" error={errors.dateEntreeVigueur}>
            <input
              type="date"
              value={dateEntreeVigueur}
              onChange={(event) => onDateEntreeVigueurChange(event.target.value)}
              onBlur={() => onFieldBlur("dateEntreeVigueur")}
              className="h-9 w-full rounded border border-[#e5eaf2] bg-white px-3 text-[12px] text-[#071f3d] outline-none transition focus:border-[#071f3d]"
            />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Version">
            <input
              type="text"
              value={version}
              onChange={(event) => onVersionChange(event.target.value)}
              placeholder="Ex: 2024-01"
              className="h-9 w-full rounded border border-[#e5eaf2] bg-white px-3 text-[12px] text-[#071f3d] outline-none transition focus:border-[#071f3d]"
            />
          </FormField>

          <FormField label="Relation juridique">
            <select
              value={relationType}
              onChange={(event) => onRelationTypeChange(event.target.value as LegalRelationTypeValue)}
              className="h-9 w-full rounded border border-[#e5eaf2] bg-white px-3 text-[12px] text-[#071f3d] outline-none transition focus:border-[#071f3d]"
            >
              {relationTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {showRelatedDocument ? (
          <div className="rounded border border-[#e5eaf2] bg-[#f7f9fc] p-3">
            <div className="space-y-3">
              <FormField label="Rechercher un document lie">
                <input
                  type="text"
                  value={relationSearch}
                  onChange={(event) => onRelationSearchChange(event.target.value)}
                  placeholder="Tapez un titre pour filtrer les documents"
                  className="h-9 w-full rounded border border-[#e5eaf2] bg-white px-3 text-[12px] text-[#071f3d] outline-none transition focus:border-[#071f3d]"
                />
              </FormField>

              <FormField label="Document concerne" error={errors.relatedDocumentId}>
                <select
                  value={relatedDocumentId}
                  onChange={(event) => onRelatedDocumentIdChange(event.target.value)}
                  onBlur={() => onFieldBlur("relatedDocumentId")}
                  className="h-9 w-full rounded border border-[#e5eaf2] bg-white px-3 text-[12px] text-[#071f3d] outline-none transition focus:border-[#071f3d]"
                >
                  <option value="">Selectionnez un document</option>
                  {relatedDocumentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
