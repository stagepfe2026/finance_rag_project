
import type { ReclamationPriority, ReclamationProblemType } from "../../../../models/reclamation";
import ReclamationFormActions from "./ReclamationFormActions";
import ReclamationFormFields from "./ReclamationFormFields";

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
}: Props) {
  return (
    <section className="border border-[#efe4e1] bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-[17px] font-bold text-[#cf3d4c]">Formulaire de Réclamation</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Remplissez le formulaire ci-dessous pour signaler un problème.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <ReclamationFormFields
          values={values}
          errors={errors}
          fieldClassName={fieldClassName}
          onChange={onChange}
        />

        {submitError ? <p className="text-xs text-rose-600">{submitError}</p> : null}
        {successMessage ? <p className="text-xs text-emerald-600">{successMessage}</p> : null}

        <ReclamationFormActions
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          onClose={onClose}
          onOpenList={onOpenList}
        />
      </div>
    </section>
  );
}