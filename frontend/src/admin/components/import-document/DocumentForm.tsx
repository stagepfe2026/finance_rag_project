import type { ReactNode } from "react";

import type {
  CategoryOption,
  CategoryValue,
  FileMeta,
  LegalDocumentTypeValue,
  LegalRelationTypeValue,
  LegalStatusValue,
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
  description: string;
  legalStatus: LegalStatusValue;
  legalStatusOptions: SelectOption[];
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
  fileMeta: FileMeta | null;
  onCategoryChange: (value: CategoryValue) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLegalStatusChange: (value: LegalStatusValue) => void;
  onDocumentTypeChange: (value: LegalDocumentTypeValue) => void;
  onDatePublicationChange: (value: string) => void;
  onDateEntreeVigueurChange: (value: string) => void;
  onVersionChange: (value: string) => void;
  onRelationTypeChange: (value: LegalRelationTypeValue) => void;
  onRelatedDocumentIdChange: (value: string) => void;
  onRelationSearchChange: (value: string) => void;
  onClearFile: () => void;
};

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-[#111111]">{label}</label>
      {children}
    </div>
  );
}

export default function DocumentForm({
  category,
  categoryOptions,
  title,
  description,
  legalStatus,
  legalStatusOptions,
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
  onCategoryChange,
  onTitleChange,
  onDescriptionChange,
  onLegalStatusChange,
  onDocumentTypeChange,
  onDatePublicationChange,
  onDateEntreeVigueurChange,
  onVersionChange,
  onRelationTypeChange,
  onRelatedDocumentIdChange,
  onRelationSearchChange,
}: DocumentFormProps) {
  const showRelatedDocument = relationType !== "none";

  return (
    <div className="rounded-l border border-[#ede7e5] p-4 shadow-[0_10px_35px_rgba(87,51,39,0.04)]">
      <div className="space-y-4">
        <FormField label="Categorie">
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value as CategoryValue)}
            className="h-10 w-full rounded-xl border border-[#ebe5e4] bg-white px-3.5 text-[12px] text-[#4c4847] outline-none transition focus:border-[#9d0208]"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Type de document">
            <select
              value={documentType}
              onChange={(event) => onDocumentTypeChange(event.target.value as LegalDocumentTypeValue)}
              className="h-10 w-full rounded-xl border border-[#ebe5e4] bg-white px-3.5 text-[12px] text-[#4c4847] outline-none transition focus:border-[#9d0208]"
            >
              {documentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Statut juridique">
            <select
              value={legalStatus}
              onChange={(event) => onLegalStatusChange(event.target.value as LegalStatusValue)}
              className="h-10 w-full rounded-xl border border-[#ebe5e4] bg-white px-3.5 text-[12px] text-[#4c4847] outline-none transition focus:border-[#9d0208]"
            >
              {legalStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Titre">
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Le titre sera rempli automatiquement"
            className="h-10 w-full rounded-xl border border-[#ebe5e4] bg-white px-3.5 text-[12px] text-[#4c4847] outline-none transition focus:border-[#9d0208]"
          />
        </FormField>

        <FormField label="Description">
          <textarea
            rows={3}
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Resume genere ou description metier du document"
            className="w-full rounded-xl border border-[#ebe5e4] bg-white px-3.5 py-2.5 text-[12px] text-[#4c4847] outline-none transition focus:border-[#9d0208]"
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Date de publication">
            <input
              type="date"
              value={datePublication}
              onChange={(event) => onDatePublicationChange(event.target.value)}
              className="h-10 w-full rounded-xl border border-[#ebe5e4] bg-white px-3.5 text-[12px] text-[#4c4847] outline-none transition focus:border-[#9d0208]"
            />
          </FormField>

          <FormField label="Date d entree en vigueur">
            <input
              type="date"
              value={dateEntreeVigueur}
              onChange={(event) => onDateEntreeVigueurChange(event.target.value)}
              className="h-10 w-full rounded-xl border border-[#ebe5e4] bg-white px-3.5 text-[12px] text-[#4c4847] outline-none transition focus:border-[#9d0208]"
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
              className="h-10 w-full rounded-xl border border-[#ebe5e4] bg-white px-3.5 text-[12px] text-[#4c4847] outline-none transition focus:border-[#9d0208]"
            />
          </FormField>

          <FormField label="Relation juridique">
            <select
              value={relationType}
              onChange={(event) => onRelationTypeChange(event.target.value as LegalRelationTypeValue)}
              className="h-10 w-full rounded-xl border border-[#ebe5e4] bg-white px-3.5 text-[12px] text-[#4c4847] outline-none transition focus:border-[#9d0208]"
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
          <div className="rounded-2xl border border-[#f0e2df] bg-[#fff8f7] p-3">
            <div className="space-y-3">
              <FormField label="Rechercher un document lie">
                <input
                  type="text"
                  value={relationSearch}
                  onChange={(event) => onRelationSearchChange(event.target.value)}
                  placeholder="Tapez un titre pour filtrer les documents"
                  className="h-10 w-full rounded-xl border border-[#ebe5e4] bg-white px-3.5 text-[12px] text-[#4c4847] outline-none transition focus:border-[#9d0208]"
                />
              </FormField>

              <FormField label="Document concerne">
                <select
                  value={relatedDocumentId}
                  onChange={(event) => onRelatedDocumentIdChange(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#ebe5e4] bg-white px-3.5 text-[12px] text-[#4c4847] outline-none transition focus:border-[#9d0208]"
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
