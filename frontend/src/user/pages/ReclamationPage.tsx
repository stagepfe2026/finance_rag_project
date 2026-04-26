import { useEffect, useMemo, useState } from "react";

import type {
  CreateReclamationInput,
  Reclamation,
  ReclamationPriority,
  ReclamationProblemType,
  ReclamationStatus,
} from "../../models/reclamation";
import { createReclamation, deleteReclamation, fetchReclamations } from "../../services/reclamation.service";
import Snackbar from "../components/chat/Snackbar";
import ReclamationForm from "../components/reclamation/create/ReclamationForm";
import ReclamationDesk from "../components/reclamation/ReclamationDesk";

const pageSize = 6;
const allowedFileExtensions = ["pdf", "png", "jpg", "jpeg", "doc", "docx"];
const maxFileSize = 5 * 1024 * 1024;

type FormValues = {
  subject: string;
  description: string;
  problemType: ReclamationProblemType | "";
  customProblemType: string;
  priority: ReclamationPriority | "";
  attachment: File | null;
};

type FieldErrors = Partial<
  Record<
    "subject" | "description" | "problemType" | "customProblemType" | "priority" | "attachment",
    string
  >
>;

type SnackbarState = {
  open: boolean;
  message: string;
  tone: "success" | "error" | "info";
};

const initialValues: FormValues = {
  subject: "",
  description: "",
  problemType: "",
  customProblemType: "",
  priority: "",
  attachment: null,
};

export default function ReclamationPage() {
  useEffect(() => {
    document.title = "Reclamations | CIMF";
  }, []);

  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReclamationStatus | "ALL">("ALL");
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [pageError, setPageError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Reclamation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>(initialValues);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", tone: "info" });

  async function loadReclamations() {
    setIsLoading(true);
    setPageError("");

    try {
      const data = await fetchReclamations();
      setReclamations(data);
      setSelectedReclamation((current) => {
        if (!current) {
          return null;
        }
        return data.find((item) => item._id === current._id) ?? null;
      });
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Erreur pendant le chargement des reclamations.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReclamations();
  }, []);

  useEffect(() => {
    if (!snackbar.open) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSnackbar((current) => ({ ...current, open: false }));
    }, 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [snackbar.open, snackbar.message]);

  const filteredReclamations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return reclamations.filter((reclamation) => {
      const matchesSearch =
        !keyword ||
        reclamation.subject.toLowerCase().includes(keyword) ||
        reclamation.ticketNumber.toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "ALL" || reclamation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reclamations, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReclamations.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedReclamations = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredReclamations.slice(startIndex, startIndex + pageSize);
  }, [filteredReclamations, page]);

  function handleConsult(reclamation: Reclamation) {
    setSelectedReclamation(reclamation);
  }

  function handleAskDelete(reclamation: Reclamation) {
    setDeleteTarget(reclamation);
  }

  function handleCloseDeleteModal() {
    if (isDeleting) {
      return;
    }
    setDeleteTarget(null);
  }

  function updateField(field: keyof FormValues, value: string | File | null) {
    setFormValues((current) => {
      if (field === "problemType" && value !== "AUTRE") {
        return { ...current, problemType: value as ReclamationProblemType | "", customProblemType: "" };
      }
      return { ...current, [field]: value };
    });
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  function countWords(value: string) {
    return value.trim().split(/\s+/).filter(Boolean).length;
  }

  function validateForm() {
    const nextErrors: FieldErrors = {};

    if (!formValues.subject.trim()) {
      nextErrors.subject = "Le sujet est obligatoire.";
    } else if (formValues.subject.trim().length < 3) {
      nextErrors.subject = "Le sujet doit contenir au moins 3 caracteres.";
    }

    if (!formValues.description.trim()) {
      nextErrors.description = "La description est obligatoire.";
    } else if (countWords(formValues.description) < 7) {
      nextErrors.description = "La description doit contenir au minimum 7 mots.";
    }

    if (!formValues.problemType) {
      nextErrors.problemType = "Veuillez selectionner un type de probleme.";
    }

    if (formValues.problemType === "AUTRE" && !formValues.customProblemType.trim()) {
      nextErrors.customProblemType = "Veuillez preciser le type de probleme.";
    }

    if (!formValues.priority) {
      nextErrors.priority = "Veuillez selectionner une priorite.";
    }

    if (formValues.attachment) {
      const extension = formValues.attachment.name.split(".").pop()?.toLowerCase() ?? "";
      if (!allowedFileExtensions.includes(extension)) {
        nextErrors.attachment = "Format de fichier non supporte.";
      } else if (formValues.attachment.size > maxFileSize) {
        nextErrors.attachment = "La piece jointe ne doit pas depasser 5 Mo.";
      }
    }

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSnackbar({
        open: true,
        message: Object.values(nextErrors)[0] ?? "Veuillez verifier le formulaire.",
        tone: "error",
      });
      return false;
    }

    return true;
  }

  async function handleCreateSubmit() {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateReclamationInput = {
        subject: formValues.subject.trim(),
        description: formValues.description.trim(),
        problemType: formValues.problemType as ReclamationProblemType,
        customProblemType: formValues.problemType === "AUTRE" ? formValues.customProblemType.trim() : "",
        priority: formValues.priority as ReclamationPriority,
        attachment: formValues.attachment,
      };
      const created = await createReclamation(payload);
      setReclamations((current) => [created, ...current]);
      setFormValues(initialValues);
      setFormErrors({});
      setIsCreating(false);
      setSnackbar({
        open: true,
        message: `Reclamation creee avec succes. Ticket ${created.ticketNumber}`,
        tone: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Impossible d envoyer la reclamation.",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      setIsDeleting(true);
      setPageError("");
      await deleteReclamation(deleteTarget._id);

      setReclamations((current) =>
        current.filter((reclamation) => reclamation._id !== deleteTarget._id),
      );
      setSelectedReclamation((current) =>
        current?._id === deleteTarget._id ? null : current,
      );
      setDeleteTarget(null);
      setSnackbar({
        open: true,
        message: "La reclamation a ete retiree de votre liste.",
        tone: "success",
      });
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer la reclamation.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <ReclamationDesk
        reclamations={paginatedReclamations}
        allReclamations={reclamations}
        selectedReclamation={selectedReclamation}
        search={search}
        statusFilter={statusFilter}
        page={page}
        totalPages={totalPages}
        totalResults={filteredReclamations.length}
        isLoading={isLoading}
        pageError={pageError}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onPageChange={setPage}
        onSelect={handleConsult}
        onDelete={handleAskDelete}
        onRefresh={() => void loadReclamations()}
        onCreate={() => {
          setIsCreating(true);
          setSelectedReclamation(null);
        }}
        onCloseDetails={() => setSelectedReclamation(null)}
        deleteTarget={deleteTarget}
        isDeleting={isDeleting}
        onCloseDeleteModal={handleCloseDeleteModal}
        onConfirmDelete={() => void handleConfirmDelete()}
        isCreating={isCreating}
        createForm={(
          <ReclamationForm
            values={formValues}
            errors={formErrors}
            submitError=""
            successMessage=""
            isSubmitting={isSubmitting}
            onChange={updateField}
            onSubmit={() => void handleCreateSubmit()}
            onClose={() => setIsCreating(false)}
            onOpenList={() => setIsCreating(false)}
            modeLabel="Nouvelle reclamation"
          />
        )}
      />

      <Snackbar open={snackbar.open} message={snackbar.message} tone={snackbar.tone} />
    </>
  );
}
