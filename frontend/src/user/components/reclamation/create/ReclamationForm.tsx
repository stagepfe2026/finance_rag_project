import { X } from "lucide-react";
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
  modeLabel?: string;
};

function fieldClassName(hasError: boolean) {
  return [
    "w-full rounded-lg border bg-white px-3 py-2 text-[12px] text-slate-800 outline-none transition placeholder:text-slate-400",
    hasError
      ? "border-rose-300 focus:border-rose-400"
      : "border-slate-200 focus:border-[#9d0208] focus:ring-2 focus:ring-[#9d0208]/10",
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
  modeLabel = "Nouvelle reclamation",
}: Props) {
  const progressSteps: Array<{ label: string; completed: boolean }> = [
    { label: "Informations", completed: values.subject.trim().length > 0 },
    { label: "Details", completed: values.description.trim().split(/\s+/).filter(Boolean).length >= 7 },
    { label: "Categorie", completed: values.problemType !== "" && values.priority !== "" },
    { label: "Piece jointe", completed: values.attachment !== null },
    {
      label: "Confirmation",
      completed:
        values.subject.trim().length > 0 &&
        values.description.trim().split(/\s+/).filter(Boolean).length >= 7 &&
        values.problemType !== "" &&
        values.priority !== "",
    },
  ];
  const completedSteps = progressSteps.filter((step) => step.completed).length;
  const completion = Math.round((completedSteps / progressSteps.length) * 100);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
      <div className="border-b border-slate-100 px-6 pb-3 pt-5">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h1 className="text-lg font-bold leading-none text-[#9d0208]">{modeLabel}</h1>
            <p className="mt-2 text-sm text-slate-500">
              Remplissez le formulaire ci-dessous pour signaler un probleme et suivre son traitement.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#9d0208]"
            aria-label="Fermer la creation de reclamation"
            title="Fermer"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="px-3 pb-3 pt-1">
          <div className="relative h-8">
            <span className="absolute left-0 right-0 top-3 h-1 rounded-full bg-slate-300" />
            <span
              className="absolute left-0 top-3 h-1 rounded-full bg-[#c1121f] transition-all"
              style={{ width: `${completion}%` }}
            />

            {progressSteps.map((step, index) => {
              const position = `${(index / (progressSteps.length - 1)) * 100}%`;
              const isReached = index <= completedSteps;

              return (
                <span
                  key={step.label}
                  className={[
                    "absolute top-1.5 h-4 w-4 -translate-x-1/2 rounded-full border-2 bg-white transition",
                    isReached
                      ? "border-[#c1121f] shadow-[0_0_0_5px_rgba(193,18,31,0.10)]"
                      : "border-slate-300",
                  ].join(" ")}
                  style={{ left: position }}
                  aria-label={step.label}
                >
                  {isReached ? (
                    <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c1121f]" />
                  ) : null}
                </span>
              );
            })}
          </div>

          <div className="text-center text-[12px] font-medium text-slate-500">
            Progression globale : <span className="font-bold text-[#c1121f]">{completion}%</span>
          </div>
        </div>

        <div className="mt-2">
          <ReclamationFormFields
            values={values}
            errors={errors}
            fieldClassName={fieldClassName}
            onChange={onChange}
          />
        </div>

        <div className="mt-2 space-y-1">
          {submitError ? <p className="text-xs text-rose-600">{submitError}</p> : null}
          {successMessage ? <p className="text-xs text-emerald-600">{successMessage}</p> : null}
        </div>

        <div className="mt-3">
          <ReclamationFormActions
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onClose={onClose}
          />
        </div>
      </div>
    </section>
  );
}
