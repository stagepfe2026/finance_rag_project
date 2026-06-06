import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  categoryOptions,
  legalDocumentTypeOptions,
  legalRelationTypeOptions,
  type CategoryValue,
  type FileMeta,
  type LegalDocumentTypeValue,
  type LegalRelationTypeValue,
  type PreviewItem,
  type ProgressStep,
} from "../../models/import-document";
import { fetchDocuments, indexDocument, previewWordDocument } from "../../services/documents.service";
import {
  documentCategoryLabels,
  legalDocumentTypeLabels,
  type DocumentItem,
} from "../../models/document";

// Chemin stable copie dans l'image Docker pour eviter les erreurs de worker PDF hashe.
pdfjsLib.GlobalWorkerOptions.workerSrc = "/assets/pdf.worker.min.mjs";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const MAX_DOCUMENT_UPLOAD_SIZE = 20 * 1024 * 1024;

type FieldName = "title" | "documentType" | "datePublication" | "dateEntreeVigueur" | "relatedDocumentId";
type FieldErrors = Partial<Record<FieldName, string>>;

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function titleFromFileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  return withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

async function buildPdfPreview(file: File) {
  const fileBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
  // Limite volontaire: quelques pages suffisent pour confirmer le contenu sans ralentir l'import.
  const pagesToRender = Math.min(pdf.numPages, 6);
  const previewItems: PreviewItem[] = [];

  for (let pageNumber = 1; pageNumber <= pagesToRender; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.35 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Impossible de créer le canvas de prévisualisation.");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));

    if (!blob) {
      throw new Error("Impossible de générer l'image de prévisualisation.");
    }

    previewItems.push({ pageNumber, imageUrl: URL.createObjectURL(blob) });
  }

  return { pageCount: pdf.numPages, previewItems };
}

export function useImportDocumentViewModel() {
  const [selectedFile, setSelectedFile]           = useState<File | null>(null);
  const [category, setCategory]                   = useState<CategoryValue>("finance");
  const [title, setTitle]                         = useState("");
  const [documentType, setDocumentType]           = useState<LegalDocumentTypeValue>("");
  const [datePublication, setDatePublication]     = useState("");
  const [dateEntreeVigueur, setDateEntreeVigueur] = useState("");
  const [relationType, setRelationType]           = useState<LegalRelationTypeValue>("none");
  const [relatedDocumentId, setRelatedDocumentId] = useState("");
  const [relationSearch, setRelationSearch]       = useState("");
  const [availableDocuments, setAvailableDocuments] = useState<DocumentItem[]>([]);
  const [previewItems, setPreviewItems]           = useState<PreviewItem[]>([]);
  const [textPreview, setTextPreview]             = useState("");
  const [wordCount, setWordCount]                 = useState<number | null>(null);
  const [pageCount, setPageCount]                 = useState<number | null>(null);
  const [previewError, setPreviewError]           = useState("");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting]           = useState(false);
  const [submitError, setSubmitError]             = useState("");
  const [fieldErrors, setFieldErrors]             = useState<FieldErrors>({});
  const [snackbar, setSnackbar]                   = useState<{ open: boolean; message: string; tone: "success" | "error" | "info" }>({ open: false, message: "", tone: "error" });
  const [isIndexed, setIsIndexed]                 = useState(false);
  const [titleTouched, setTitleTouched]           = useState(false);

  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => { previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadAvailableDocuments() {
      try {
        const response = await fetchDocuments({ apiBaseUrl, limit: 100 });
        if (!cancelled) setAvailableDocuments(response.items);
      } catch (error) {
        console.error(error);
      }
    }
    void loadAvailableDocuments();
    return () => { cancelled = true; };
  }, []);

  const showSnackbar = useCallback((message: string, tone: "success" | "error" | "info" = "error") => {
    setSnackbar({ open: true, message, tone });
  }, []);

  const closeSnackbar = useCallback(() => setSnackbar((c) => ({ ...c, open: false })), []);

  const buildPreview = useCallback(async (file: File) => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
    setPreviewItems([]);
    setTextPreview("");
    setWordCount(null);
    setPageCount(null);
    setPreviewError("");
    setIsGeneratingPreview(true);

    try {
      const isPdf  = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isDocx = file.name.toLowerCase().endsWith(".docx");

      if (isPdf) {
        const preview = await buildPdfPreview(file);
        previewUrlsRef.current = preview.previewItems.map((item) => item.imageUrl);
        setPreviewItems(preview.previewItems);
        setPageCount(preview.pageCount);
        return;
      }

      if (isDocx) {
        const preview = await previewWordDocument({ apiBaseUrl, file });
        setTextPreview(preview.content || "Aucun texte lisible trouvé dans ce document Word.");
        setWordCount(preview.wordCount);
        setPageCount(null);
        return;
      }

      setPreviewError("La prévisualisation est disponible pour les PDF et DOCX.");
    } catch (error) {
      console.error(error);
      setPreviewError(error instanceof Error ? error.message : "Impossible de générer la prévisualisation.");
    } finally {
      setIsGeneratingPreview(false);
    }
  }, []);

  function validateField(field: FieldName): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const publicationDate = datePublication ? new Date(`${datePublication}T00:00:00`) : null;
    const effectiveDate   = dateEntreeVigueur ? new Date(`${dateEntreeVigueur}T00:00:00`) : null;

    if (field === "title" && !title.trim()) return "Le titre est obligatoire.";
    if (field === "documentType" && !documentType) return "Le type de document est obligatoire.";
    if (field === "datePublication" && publicationDate && publicationDate > today)
      return "La date de publication ne peut pas être future.";
    if (field === "dateEntreeVigueur") {
      if (!dateEntreeVigueur) return "La date d'entrée en vigueur est obligatoire.";
      if (publicationDate && effectiveDate && effectiveDate < publicationDate)
        return "La date d'entrée en vigueur doit être postérieure ou égale à la date de publication.";
    }
    if (field === "relatedDocumentId" && relationType !== "none" && !relatedDocumentId)
      return "Sélectionnez le document concerné.";
    return "";
  }

  function validateReplacementTarget(): string {
    if (relationType !== "remplace" || !relatedDocumentId) return "";

    const targetDocument = availableDocuments.find((doc) => doc.id === relatedDocumentId);
    if (!targetDocument) return "Le document à remplacer est introuvable.";

    // Regle metier: un remplacement ne peut viser qu'un document du meme dossier juridique.
    if (targetDocument.category !== category) {
      return `Le document remplacé doit appartenir à la même catégorie (${documentCategoryLabels[targetDocument.category]}).`;
    }

    if (targetDocument.legalType !== documentType) {
      return `Le document remplacé doit avoir le même type juridique (${legalDocumentTypeLabels[targetDocument.legalType]}).`;
    }

    return "";
  }

  function validateAllFields() {
    const fields: FieldName[] = ["title", "documentType", "datePublication", "dateEntreeVigueur", "relatedDocumentId"];
    const nextErrors: FieldErrors = {};
    for (const field of fields) {
      const error = validateField(field);
      if (error) nextErrors[field] = error;
    }
    setFieldErrors(nextErrors);
    return nextErrors;
  }

  const handleFieldBlur = useCallback((field: FieldName) => {
    const error = validateField(field);
    setFieldErrors((current) => {
      const next = { ...current };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
    if (error) showSnackbar(error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datePublication, dateEntreeVigueur, title, documentType, relationType, relatedDocumentId, showSnackbar]);

  const handleFileSelect = useCallback((file: File | null) => {
    setSubmitError("");
    setIsIndexed(false);
    setFieldErrors({});

    if (file) {
      const allowed = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") || file.name.toLowerCase().endsWith(".docx");
      if (!allowed) { showSnackbar("Seuls les fichiers PDF et DOCX sont supportés."); return; }
      if (file.size > MAX_DOCUMENT_UPLOAD_SIZE) { showSnackbar("Le fichier dépasse la taille maximale autorisée."); return; }
    }

    setSelectedFile(file);
    setRelationType("none");
    setRelatedDocumentId("");
    setRelationSearch("");

    if (!file) {
      setTitle("");
      setTitleTouched(false);
      setDocumentType("");
      setDatePublication("");
      setDateEntreeVigueur("");
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
      setPreviewItems([]);
      setTextPreview("");
      setWordCount(null);
      setPageCount(null);
      setPreviewError("");
      return;
    }

    setTitle((currentTitle) => {
      if (!titleTouched) return titleFromFileName(file.name);
      return currentTitle;
    });

    void buildPreview(file);
  }, [buildPreview, showSnackbar, titleTouched]);

  const handleSubmit = useCallback(async () => {
    if (!selectedFile) {
      const message = "Choisissez un document avant de lancer l'indexation.";
      setSubmitError(message);
      showSnackbar(message);
      return;
    }

    const errors = validateAllFields();
    const firstError = Object.values(errors)[0];
    if (firstError) {
      setSubmitError(firstError);
      showSnackbar(firstError);
      return;
    }

    const replacementError = validateReplacementTarget();
    if (replacementError) {
      setSubmitError(replacementError);
      setFieldErrors((current) => ({ ...current, relatedDocumentId: replacementError }));
      showSnackbar(replacementError);
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);
    setIsIndexed(false);

    try {
      if (relationType !== "none" && !relatedDocumentId) {
        const message = "Sélectionnez le document concerné.";
        setSubmitError(message);
        showSnackbar(message);
        return;
      }

      await indexDocument({
        apiBaseUrl,
        file: selectedFile,
        category,
        title,
        documentType,
        datePublication: datePublication || undefined,
        dateEntreeVigueur: dateEntreeVigueur || undefined,
        relationType,
        relatedDocumentId: relationType === "none" ? undefined : relatedDocumentId,
      });
      setIsIndexed(true);
      showSnackbar("Document indexé avec succès.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue pendant l'indexation.";
      setSubmitError(message);
      showSnackbar(message);
    } finally {
      setIsSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, relationType, relatedDocumentId, category, title, documentType, datePublication, dateEntreeVigueur, availableDocuments, showSnackbar]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setCategory("finance");
    setTitle("");
    setDocumentType("");
    setDatePublication("");
    setDateEntreeVigueur("");
    setRelationType("none");
    setRelatedDocumentId("");
    setRelationSearch("");
    setPreviewItems([]);
    setTextPreview("");
    setWordCount(null);
    setPageCount(null);
    setPreviewError("");
    setIsGeneratingPreview(false);
    setIsSubmitting(false);
    setSubmitError("");
    setFieldErrors({});
    setIsIndexed(false);
    setTitleTouched(false);
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
  }, []);

  const handleTitleChange = useCallback((value: string) => {
    setTitleTouched(true);
    setTitle(value);
    setFieldErrors((c) => ({ ...c, title: "" }));
  }, []);

  const handleDocumentTypeChange = useCallback((value: LegalDocumentTypeValue) => {
    setDocumentType(value);
    setFieldErrors((c) => ({ ...c, documentType: "" }));
  }, []);

  const handleDatePublicationChange = useCallback((value: string) => {
    setDatePublication(value);
    setFieldErrors((c) => ({ ...c, datePublication: "" }));
  }, []);

  const handleDateEntreeVigueurChange = useCallback((value: string) => {
    setDateEntreeVigueur(value);
    setFieldErrors((c) => ({ ...c, dateEntreeVigueur: "" }));
  }, []);

  const handleRelationTypeChange = useCallback((value: LegalRelationTypeValue) => {
    setRelationType(value);
    if (value === "none") setRelatedDocumentId("");
  }, []);

  const handleRelatedDocumentIdChange = useCallback((value: string) => {
    setRelatedDocumentId(value);
    const targetDocument = availableDocuments.find((doc) => doc.id === value);
    if (!targetDocument || relationType !== "remplace") {
      setFieldErrors((c) => ({ ...c, relatedDocumentId: "" }));
      return;
    }

    const mismatchMessage =
      targetDocument.category !== category
        ? `Le document remplacé doit appartenir à la même catégorie (${documentCategoryLabels[targetDocument.category]}).`
        : targetDocument.legalType !== documentType
          ? `Le document remplacé doit avoir le même type juridique (${legalDocumentTypeLabels[targetDocument.legalType]}).`
          : "";

    setFieldErrors((current) => ({ ...current, relatedDocumentId: mismatchMessage }));
    if (mismatchMessage) showSnackbar(mismatchMessage);
  }, [availableDocuments, category, documentType, relationType, showSnackbar]);

  const fileMeta: FileMeta | null = useMemo(() => {
    if (!selectedFile) return null;
    return {
      name: selectedFile.name,
      extensionLabel: selectedFile.name.split(".").pop()?.toUpperCase() ?? "FILE",
      sizeLabel: formatBytes(selectedFile.size),
      pageCountLabel: pageCount
        ? `${pageCount} pages`
        : wordCount !== null
          ? `${wordCount} mots`
          : previewError
            ? "Prévisualisation limitée"
            : "Analyse en cours",
    };
  }, [pageCount, previewError, selectedFile, wordCount]);

  const steps: ProgressStep[] = [
    {
      label: "Fichier choisi",
      sub: selectedFile?.name ?? "Aucun document sélectionné",
      status: selectedFile ? "done" : "todo",
    },
    {
      label: "Informations extraites",
      sub: selectedFile
        ? previewError || (pageCount ? `${pageCount} pages détectées` : isGeneratingPreview ? "Analyse du document..." : "Métadonnées prêtes")
        : "En attente du fichier",
      status: !selectedFile ? "todo" : isGeneratingPreview ? "current" : "done",
    },
    {
      label: "Fichier en cours d'indexation",
      sub: submitError
        ? submitError
        : isSubmitting
          ? "Envoi au backend et indexation en cours..."
          : isIndexed
            ? "Indexation terminée"
            : "En attente du lancement",
      status: submitError ? "error" : isSubmitting ? "current" : isIndexed ? "done" : "todo",
    },
    {
      label: "Fichier indexé",
      sub: isIndexed ? "Le document est enregistré dans MongoDB et indexé." : "En attente",
      status: isIndexed ? "done" : "todo",
    },
  ];

  const relatedDocumentOptions = useMemo(() => {
    const normalizedSearch = relationSearch.trim().toLowerCase();
    return availableDocuments
      .filter((doc) => !normalizedSearch || doc.title.toLowerCase().includes(normalizedSearch))
      .slice(0, 80)
      .map((doc) => ({ id: doc.id, title: `${doc.title} (${doc.createdAt.slice(0, 10)})` }));
  }, [availableDocuments, relationSearch]);

  return {
    // Etat
    selectedFile,
    category,
    title,
    documentType,
    datePublication,
    dateEntreeVigueur,
    relationType,
    relatedDocumentId,
    relationSearch,
    previewItems,
    textPreview,
    wordCount,
    pageCount,
    previewError,
    isGeneratingPreview,
    isSubmitting,
    submitError,
    fieldErrors,
    snackbar,
    isIndexed,
    // Valeurs calculees
    fileMeta,
    steps,
    relatedDocumentOptions,
    // Options de formulaire
    categoryOptions,
    legalDocumentTypeOptions,
    legalRelationTypeOptions,
    // Actions
    handleFileSelect,
    handleSubmit,
    handleReset,
    handleFieldBlur,
    handleTitleChange,
    handleDocumentTypeChange,
    handleDatePublicationChange,
    handleDateEntreeVigueurChange,
    handleRelationTypeChange,
    handleRelatedDocumentIdChange,
    onCategoryChange:       setCategory,
    onRelationSearchChange: setRelationSearch,
    closeSnackbar,
  };
}
