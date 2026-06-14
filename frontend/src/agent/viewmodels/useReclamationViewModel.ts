import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type {
  CreateReclamationInput,
  Reclamation,
  ReclamationPriority,
  ReclamationProblemType,
  ReclamationReadFilter,
  ReclamationStatus,
} from "../../models/reclamation";
import {
  createReclamation,
  deleteReclamation,
  fetchReclamations,
  markReclamationReplyAsRead,
  updateReclamation,
} from "../../services/reclamation.service";

const pageSize = 8;
const allowedFileExtensions = ["pdf", "png", "jpg", "jpeg", "doc", "docx"];
const maxFileSize = 5 * 1024 * 1024;

export type FormValues = {
  subject: string;
  description: string;
  problemType: ReclamationProblemType | "";
  customProblemType: string;
  priority: ReclamationPriority | "";
  attachment: File | null;
};

export type FieldErrors = Partial<
  Record<
    "subject" | "description" | "problemType" | "customProblemType" | "priority" | "attachment",
    string
  >
>;

export type SnackbarState = {
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

function hasUnreadReply(reclamation: Reclamation) {
  return Boolean(reclamation.adminReply) && !reclamation.replyAcknowledged;
}

function hasReadReply(reclamation: Reclamation) {
  return Boolean(reclamation.adminReply) && reclamation.replyAcknowledged;
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function useReclamationViewModel() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = "Reclamations | CIMF";
  }, []);

  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReclamationStatus | "ALL">("ALL");
  const [readFilter, setReadFilter] = useState<ReclamationReadFilter>("ALL");
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingReclamation, setEditingReclamation] = useState<Reclamation | null>(null);
  const [page, setPage] = useState(1);
  const [pageError, setPageError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Reclamation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>(initialValues);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", tone: "info" });
  const shouldOpenCreateModal = searchParams.get("new") === "1";

  useEffect(() => {
    if (!shouldOpenCreateModal) {
      return;
    }

    setIsCreating(true);
    setSelectedReclamation(null);
  }, [shouldOpenCreateModal]);

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
        reclamation.referenceNumber.toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "ALL" || reclamation.status === statusFilter;
      const matchesRead =
        readFilter === "ALL" ||
        (readFilter === "UNREAD" && hasUnreadReply(reclamation)) ||
        (readFilter === "READ" && hasReadReply(reclamation));

      return matchesSearch && matchesStatus && matchesRead;
    });
  }, [readFilter, reclamations, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReclamations.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [readFilter, search, statusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedReclamations = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredReclamations.slice(startIndex, startIndex + pageSize);
  }, [filteredReclamations, page]);

  async function handleConsult(reclamation: Reclamation) {
    if (!hasUnreadReply(reclamation)) {
      setSelectedReclamation(reclamation);
      return;
    }

    const optimisticReclamation = { ...reclamation, replyAcknowledged: true };
    setSelectedReclamation(optimisticReclamation);
    setReclamations((current) =>
      current.map((item) => (item._id === reclamation._id ? optimisticReclamation : item)),
    );

    try {
      const updated = await markReclamationReplyAsRead(reclamation._id);
      setReclamations((current) =>
        current.map((item) => (item._id === updated._id ? updated : item)),
      );
      setSelectedReclamation((current) => (current?._id === updated._id ? updated : current));
    } catch (error) {
      setReclamations((current) =>
        current.map((item) => (item._id === reclamation._id ? reclamation : item)),
      );
      setSelectedReclamation((current) => (current?._id === reclamation._id ? reclamation : current));
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Impossible de marquer la reclamation comme lue.",
        tone: "error",
      });
    }
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
      closeCreateModal();
      setSnackbar({
        open: true,
        message: `Reclamation creee avec succes. Ticket ${created.referenceNumber}`,
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

  async function handleUpdateSubmit() {
    if (!editingReclamation || !validateForm()) {
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
      const updated = await updateReclamation(editingReclamation._id, payload);
      setReclamations((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setSelectedReclamation((current) => (current?._id === updated._id ? updated : current));
      closeCreateModal();
      setSnackbar({
        open: true,
        message: "Reclamation modifiee avec succes.",
        tone: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Impossible de modifier la reclamation.",
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
      setDeleteTarget(null);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Impossible de supprimer la reclamation.",
        tone: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function openCreateModal() {
    setEditingReclamation(null);
    setFormValues(initialValues);
    setFormErrors({});
    setIsCreating(true);
    setSelectedReclamation(null);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("new", "1");
      return next;
    }, { replace: true });
  }

  function closeCreateModal() {
    setIsCreating(false);
    setEditingReclamation(null);
    setFormValues(initialValues);
    setFormErrors({});
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("new");
      return next;
    }, { replace: true });
  }

  function openEditModal(reclamation: Reclamation) {
    if (reclamation.status !== "PENDING") {
      setSnackbar({
        open: true,
        message: "Seules les reclamations en attente peuvent etre modifiees.",
        tone: "error",
      });
      return;
    }

    setEditingReclamation(reclamation);
    setSelectedReclamation(null);
    setFormValues({
      subject: reclamation.subject,
      description: reclamation.description,
      problemType: reclamation.problemType,
      customProblemType: reclamation.customProblemType ?? "",
      priority: reclamation.priority,
      attachment: null,
    });
    setFormErrors({});
    setIsCreating(true);
  }

  return {
    reclamations,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    readFilter,
    setReadFilter,
    selectedReclamation,
    setSelectedReclamation,
    isCreating,
    editingReclamation,
    page,
    setPage,
    pageError,
    isLoading,
    deleteTarget,
    isDeleting,
    formValues,
    formErrors,
    isSubmitting,
    snackbar,
    filteredReclamations,
    totalPages,
    paginatedReclamations,
    loadReclamations,
    handleConsult,
    handleAskDelete,
    handleCloseDeleteModal,
    updateField,
    validateForm,
    handleCreateSubmit,
    handleUpdateSubmit,
    handleConfirmDelete,
    openCreateModal,
    closeCreateModal,
    openEditModal,
  };
}
