import { ChevronLeft } from "lucide-react";
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
  modeLabel?: string;
};

function fieldClassName(hasError: boolean) {
  return [
    "w-full rounded-[10px] border bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none transition",
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
  modeLabel = "Nouvelle reclamation",
}: Props) {
  const progressSteps = [
    values.subject.trim().length > 0,
    values.description.trim().split(/\s+/).filter(Boolean).length >= 7,
    values.problemType !== "",
    values.priority !== "",
    values.attachment !== null,
  ];
  const completedSteps = progressSteps.filter(Boolean).length;
  const completion = Math.round((completedSteps / progressSteps.length) * 100);

  return (
    <section className="min-h-[680px] rounded-[16px] border border-[#efe4e1] bg-white shadow-sm">
      <div className="border-b border-[#f1e7e5] px-6 pb-3 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={onOpenList}
              className="mb-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#8f2632] transition hover:text-[#71202a]"
            >
              <ChevronLeft size={14} />
              Retour a la liste
            </button>
            <h1 className="text-[18px] font-bold leading-none text-[#cf3d4c]">{modeLabel}</h1>
            <p className="mt-2 text-[13px] text-slate-500">
              Remplissez le formulaire ci-dessous pour signaler un probleme et suivre son traitement.
            </p>
          </div>

          <div className="w-full max-w-[320px] rounded-[12px] border border-[#efe4e1] bg-[#fcf8f7] px-4 py-3">
            <div className="flex items-center justify-between text-[12px] font-medium text-slate-600">
              <span>Progression</span>
              <span>{completion}%</span>
            </div>
            <div className="mt-2 h-2 rounded-md bg-[#eadfdb]">
              <div
                className="h-2 rounded-md bg-[#cf3d4c] transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              {completedSteps} etape(s) sur {progressSteps.length} completees
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <ReclamationFormFields
          values={values}
          errors={errors}
          fieldClassName={fieldClassName}
          onChange={onChange}
        />

        <div className="mt-4 space-y-2">
          {submitError ? <p className="text-xs text-rose-600">{submitError}</p> : null}
          {successMessage ? <p className="text-xs text-emerald-600">{successMessage}</p> : null}
        </div>

        <div className="mt-5">
          <ReclamationFormActions
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onClose={onClose}
            onOpenList={onOpenList}
          />
        </div>
      </div>
    </section>
  );
}
