import { List, Paperclip, SendHorizontal, X } from "lucide-react";

import type { ReclamationPriority, ReclamationProblemType } from "../../../models/reclamation";

type FieldErrors = Partial<
  Record<
    "subject" | "description" | "problemType" | "customProblemType" | "priority" | "attachment",
    string
  >
>;

type ReclamationFormValues = {
  subject: string;
  description: string;
  problemType: ReclamationProblemType | "";
  customProblemType: string;
  priority: ReclamationPriority | "";
  attachment: File | null;
};

type ReclamationFormProps = {
  values: ReclamationFormValues;
  errors: FieldErrors;
  submitError: string;
  successMessage: string;
  isSubmitting: boolean;
  onChange: (field: keyof ReclamationFormValues, value: string | File | null) => void;
  onSubmit: () => void;
  onClose: () => void;
  onOpenList: () => void;
};

function fieldClassName(hasError: boolean) {
  return [
    "w-full rounded-lg border bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none transition",
    hasError
      ? "border-rose-300 focus:border-rose-400"
      : "border-[#e2d8d5] focus:border-[#cf3d4c]",
  ].join(" ");
}

export default function ReclamationForm({
  values,
  errors,
  submitError,
  successMessage,
  isSubmitting,
  onChange,
  onSubmit,
  onClose,
  onOpenList,
}: ReclamationFormProps) {
  return (
    <section className="border border-[#efe4e1] bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-[17px] font-bold text-[#cf3d4c]">Formulaire de Réclamation</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Remplissez le formulaire ci-dessous pour signaler un problème.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {/* Subject */}
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
            Sujet de la réclamation <span className="text-[#cf3d4c]">*</span>
          </label>
          <input
            type="text"
            value={values.subject}
            onChange={(e) => onChange("subject", e.target.value)}
            className={fieldClassName(Boolean(errors.subject))}
          />
          {errors.subject ? (
            <p className="mt-1 text-xs text-rose-600">{errors.subject}</p>
          ) : null}
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
            Description <span className="text-[#cf3d4c]">*</span>
          </label>
          <textarea
            rows={5}
            value={values.description}
            onChange={(e) => onChange("description", e.target.value)}
            className={`${fieldClassName(Boolean(errors.description))} resize-none`}
          />
          {errors.description ? (
            <p className="mt-1 text-xs text-rose-600">{errors.description}</p>
          ) : null}
        </div>

        {/* Problem type + Attachment/Priority */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Problem type */}
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
              Type de problème <span className="text-[#cf3d4c]">*</span>
            </label>
            <select
              value={values.problemType}
              onChange={(e) => onChange("problemType", e.target.value)}
              className={fieldClassName(Boolean(errors.problemType))}
            >
              <option value="">Sélectionnez le type de problème</option>
              <option value="BUG_TECHNIQUE">Bug technique</option>
              <option value="PROBLEME_JURIDIQUE">Problème juridique</option>
              <option value="ERREUR_REPONSE_CHATBOT">Erreur de réponse du chatbot</option>
              <option value="AUTRE">Autre</option>
            </select>
            {errors.problemType ? (
              <p className="mt-1 text-xs text-rose-600">{errors.problemType}</p>
            ) : null}

            {values.problemType === "AUTRE" ? (
              <div className="mt-3">
                <input
                  type="text"
                  value={values.customProblemType}
                  onChange={(e) => onChange("customProblemType", e.target.value)}
                  placeholder="Précisez le type de problème"
                  className={fieldClassName(Boolean(errors.customProblemType))}
                />
                {errors.customProblemType ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.customProblemType}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Attachment + Priority */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                Pièce jointe
              </label>
              <label
                className={`${fieldClassName(Boolean(errors.attachment))} flex cursor-pointer items-center gap-2`}
              >
                <Paperclip size={14} className="shrink-0 text-slate-400" />
                <span className="truncate text-[13px] text-slate-500">
                  {values.attachment ? values.attachment.name : "Aucun fichier choisi"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={(e) => onChange("attachment", e.target.files?.[0] ?? null)}
                />
              </label>
              {errors.attachment ? (
                <p className="mt-1 text-xs text-rose-600">{errors.attachment}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                Priorité <span className="text-[#cf3d4c]">*</span>
              </label>
              <select
                value={values.priority}
                onChange={(e) => onChange("priority", e.target.value)}
                className={fieldClassName(Boolean(errors.priority))}
              >
                <option value="">Sélectionnez une priorité</option>
                <option value="LOW">Basse</option>
                <option value="NORMAL">Normale</option>
                <option value="HIGH">Haute</option>
              </select>
              {errors.priority ? (
                <p className="mt-1 text-xs text-rose-600">{errors.priority}</p>
              ) : null}
            </div>
          </div>
        </div>

        {submitError ? <p className="text-xs text-rose-600">{submitError}</p> : null}
        {successMessage ? <p className="text-xs text-emerald-600">{successMessage}</p> : null}

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-[#f0e8e5] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onOpenList}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e2d8d5] bg-[#faf7f6] px-4 py-2.5 text-[13px] font-medium text-slate-700 transition hover:border-[#cfc0bb]"
          >
            <List size={14} />
            Consulter la liste des réclamations
          </button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e2d8d5] bg-[#faf7f6] px-4 py-2.5 text-[13px] font-medium text-slate-700 transition hover:border-[#cfc0bb]"
            >
              <X size={14} />
              Fermer
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#cf3d4c] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#b93442] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <SendHorizontal size={14} />
              {isSubmitting ? "Envoi..." : "Soumettre la réclamation"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}