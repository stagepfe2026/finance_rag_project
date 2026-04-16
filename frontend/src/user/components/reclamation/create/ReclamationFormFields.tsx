import type { ReclamationPriority, ReclamationProblemType } from "../../../../models/reclamation";
import ReclamationAttachmentField from "./ReclamationAttachmentField";
import ReclamationPriorityField from "./ReclamationPriorityField";

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

type Props = {
  values: ReclamationFormValues;
  errors: FieldErrors;
  fieldClassName: (hasError: boolean) => string;
  onChange: (field: keyof ReclamationFormValues, value: string | File | null) => void;
};

export default function ReclamationFormFields({
  values,
  errors,
  fieldClassName,
  onChange,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
          Sujet de la reclamation <span className="text-[#cf3d4c]">*</span>
        </label>
        <input
          type="text"
          value={values.subject}
          onChange={(e) => onChange("subject", e.target.value)}
          className={fieldClassName(Boolean(errors.subject))}
        />
        {errors.subject ? <p className="mt-1 text-xs text-rose-600">{errors.subject}</p> : null}
      </div>

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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
            Type de probleme <span className="text-[#cf3d4c]">*</span>
          </label>

          <select
            value={values.problemType}
            onChange={(e) => onChange("problemType", e.target.value)}
            className={fieldClassName(Boolean(errors.problemType))}
          >
            <option value="">Selectionnez le type de probleme</option>
            <option value="BUG_TECHNIQUE">Bug technique</option>
            <option value="PROBLEME_JURIDIQUE">Probleme juridique</option>
            <option value="ERREUR_REPONSE_CHATBOT">Erreur de reponse du chatbot</option>
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
                placeholder="Precisez le type de probleme"
                className={fieldClassName(Boolean(errors.customProblemType))}
              />
              {errors.customProblemType ? (
                <p className="mt-1 text-xs text-rose-600">{errors.customProblemType}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <ReclamationAttachmentField
            file={values.attachment}
            error={errors.attachment}
            onChange={(file) => onChange("attachment", file)}
            className={fieldClassName(Boolean(errors.attachment))}
          />

          <ReclamationPriorityField
            value={values.priority}
            error={errors.priority}
            onChange={(value) => onChange("priority", value)}
            className={fieldClassName(Boolean(errors.priority))}
          />
        </div>
      </div>
    </div>
  );
}
