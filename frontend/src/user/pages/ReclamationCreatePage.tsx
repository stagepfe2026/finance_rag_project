import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { CreateReclamationInput, ReclamationPriority, ReclamationProblemType } from "../../models/reclamation";
import { createReclamation } from "../../services/reclamation.service";
import ReclamationForm from "../components/reclamation/ReclamationForm";

type FormValues = {
  subject: string;
  description: string;
  problemType: ReclamationProblemType | "";
  customProblemType: string;
  priority: ReclamationPriority | "";
  attachment: File | null;
};

type FieldErrors = Partial<Record<"subject" | "description" | "problemType" | "customProblemType" | "priority" | "attachment", string>>;

const initialValues: FormValues = {
  subject: "",
  description: "",
  problemType: "",
  customProblemType: "",
  priority: "",
  attachment: null,
};

const allowedFileExtensions = ["pdf", "png", "jpg", "jpeg", "doc", "docx"];
const maxFileSize = 5 * 1024 * 1024;

export default function ReclamationCreatePage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pageBackground = useMemo(
    () => ({
      backgroundImage:
        "radial-gradient(circle at top left, rgba(207, 61, 76, 0.10), transparent 28%), radial-gradient(circle at bottom right, rgba(169, 130, 124, 0.10), transparent 30%)",
    }),
    [],
  );

  function updateField(field: keyof FormValues, value: string | File | null) {
    setValues((current) => {
      if (field === "problemType" && value !== "AUTRE") {
        return { ...current, problemType: value as ReclamationProblemType | "", customProblemType: "" };
      }
      return { ...current, [field]: value };
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
    setSuccessMessage("");
  }

  function validateForm() {
    const nextErrors: FieldErrors = {};

    if (values.subject.trim().length < 3) {
      nextErrors.subject = "Le sujet doit contenir au moins 3 caracteres.";
    } else if (values.subject.trim().length > 160) {
      nextErrors.subject = "Le sujet ne doit pas depasser 160 caracteres.";
    }

    if (values.description.trim().length < 10) {
      nextErrors.description = "La description doit contenir au moins 10 caracteres.";
    } else if (values.description.trim().length > 3000) {
      nextErrors.description = "La description ne doit pas depasser 3000 caracteres.";
    }

    if (!values.problemType) {
      nextErrors.problemType = "Veuillez selectionner un type de probleme.";
    }

    if (values.problemType === "AUTRE" && values.customProblemType.trim().length < 2) {
      nextErrors.customProblemType = "Veuillez preciser le type de probleme.";
    }

    if (!values.priority) {
      nextErrors.priority = "Veuillez selectionner une priorite.";
    }

    if (values.attachment) {
      const extension = values.attachment.name.split(".").pop()?.toLowerCase() ?? "";
      if (!allowedFileExtensions.includes(extension)) {
        nextErrors.attachment = "Format de fichier non supporte.";
      } else if (values.attachment.size > maxFileSize) {
        nextErrors.attachment = "La piece jointe ne doit pas depasser 5 Mo.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
      setSuccessMessage("");

      const payload: CreateReclamationInput = {
        subject: values.subject.trim(),
        description: values.description.trim(),
        problemType: values.problemType as ReclamationProblemType,
        customProblemType: values.problemType === "AUTRE" ? values.customProblemType.trim() : "",
        priority: values.priority as ReclamationPriority,
        attachment: values.attachment,
      };

      const created = await createReclamation(payload);
      setValues(initialValues);
      setErrors({});
      setSuccessMessage(`Reclamation envoyee avec succes. Ticket: ${created.ticketNumber}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Impossible d envoyer la reclamation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-81px)] px-4 py-6 md:px-6" style={pageBackground}>
      <div className="mx-auto w-full max-w-6xl">
        <ReclamationForm
          values={values}
          errors={errors}
          submitError={submitError}
          successMessage={successMessage}
          isSubmitting={isSubmitting}
          onChange={updateField}
          onSubmit={() => void handleSubmit()}
          onClose={() => navigate("/user/reclamations")}
          onOpenList={() => navigate("/user/reclamations")}
        />
      </div>
    </div>
  );
}
