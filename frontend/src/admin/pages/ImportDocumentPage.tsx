import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

import UploadZone from "../components/import-document/UploadZone";
import DocumentForm from "../components/import-document/DocumentForm";
import ProgressPanel from "../components/import-document/ProgressPanel";
import PreviewPanel from "../components/import-document/PreviwPanel";
import Snackbar from "../components/Snackbar";
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
import type { DocumentItem } from "../../models/document";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

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
  const pagesToRender = Math.min(pdf.numPages, 6);
  const previewItems: PreviewItem[] = [];

  for (let pageNumber = 1; pageNumber <= pagesToRender; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.35 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Impossible de cr�er le canvas de pr�visualisation.");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));

    if (!blob) {
      throw new Error("Impossible de générer l'image de prévisualisation.");
    }

    previewItems.push({
      pageNumber,
      imageUrl: URL.createObjectURL(blob),
    });
  }

  return {
    pageCount: pdf.numPages,
    previewItems,
  };
}

export default function ImportDocumentPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<CategoryValue>("finance");
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState<LegalDocumentTypeValue>("");
  const [datePublication, setDatePublication] = useState("");
  const [dateEntreeVigueur, setDateEntreeVigueur] = useState("");
  const [version, setVersion] = useState("");
  const [relationType, setRelationType] = useState<LegalRelationTypeValue>("none");
  const [relatedDocumentId, setRelatedDocumentId] = useState("");
  const [relationSearch, setRelationSearch] = useState("");
  const [availableDocuments, setAvailableDocuments] = useState<DocumentItem[]>([]);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [textPreview, setTextPreview] = useState("");
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [previewError, setPreviewError] = useState<string>("");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", tone: "error" as "success" | "error" | "info" });
  const [isIndexed, setIsIndexed] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const previewUrlsRef = useRef<string[]>([]);
  const closeSnackbar = useCallback(() => setSnackbar((current) => ({ ...current, open: false })), []);

  function showSnackbar(message: string, tone: "success" | "error" | "info" = "error") {
    setSnackbar({ open: true, message, tone });
  }

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailableDocuments() {
      try {
        const response = await fetchDocuments({
          apiBaseUrl,
          limit: 100,
        });
        if (!cancelled) {
          setAvailableDocuments(response.items);
        }
      } catch (error) {
        console.error(error);
      }
    }

    void loadAvailableDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  async function buildPreview(file: File) {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
    setPreviewItems([]);
    setTextPreview("");
    setWordCount(null);
    setPageCount(null);
    setPreviewError("");
    setIsGeneratingPreview(true);

    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
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
        setTextPreview(preview.content || "Aucun texte lisible trouve dans ce document Word.");
        setWordCount(preview.wordCount);
        setPageCount(null);
        return;
      }

      setPreviewError("La prévisualisation est disponible pour les PDF et DOCX.");
    } catch (error) {
      console.error(error);
      setPreviewError(error instanceof Error ? error.message : "Impossible de generer la previsualisation.");
    } finally {
      setIsGeneratingPreview(false);
    }
  }

  function validateField(field: FieldName): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const publicationDate = datePublication ? new Date(`${datePublication}T00:00:00`) : null;
    const effectiveDate = dateEntreeVigueur ? new Date(`${dateEntreeVigueur}T00:00:00`) : null;

    if (field === "title" && !title.trim()) {
      return "Le titre est obligatoire.";
    }
    if (field === "documentType" && !documentType) {
      return "Le type de document est obligatoire.";
    }
    if (field === "datePublication" && publicationDate && publicationDate > today) {
      return "La date de publication ne peut pas être future.";
    }
    if (field === "dateEntreeVigueur") {
      if (!dateEntreeVigueur) {
        return "La date d’entrée en vigueur est obligatoire.";
      }
      if (publicationDate && effectiveDate && effectiveDate < publicationDate) {
        return "La date d’entrée en vigueur doit être postérieure ou égale à la date de publication.";
      }
    }
    if (field === "relatedDocumentId" && relationType !== "none" && !relatedDocumentId) {
      return "Sélectionnez le document concerné.";
    }
    return "";
  }

  function validateAllFields() {
    const fields: FieldName[] = ["title", "documentType", "datePublication", "dateEntreeVigueur", "relatedDocumentId"];
    const nextErrors: FieldErrors = {};
    for (const field of fields) {
      const error = validateField(field);
      if (error) {
        nextErrors[field] = error;
      }
    }
    setFieldErrors(nextErrors);
    return nextErrors;
  }

  function handleFieldBlur(field: FieldName) {
    const error = validateField(field);
    setFieldErrors((current) => {
      const next = { ...current };
      if (error) {
        next[field] = error;
      } else {  
        delete next[field];
      }
      return next;
    });
    if (error) {
      showSnackbar(error);
    }
  }

  function handleFileSelect(file: File | null) {
    setSubmitError("");
    setIsIndexed(false);
    setFieldErrors({});

    if (file) {
      const allowedFile = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") || file.name.toLowerCase().endsWith(".docx");
      if (!allowedFile) {
        showSnackbar("Seuls les fichiers PDF et DOCX sont supportés.");
        return;
      }
      if (file.size > MAX_DOCUMENT_UPLOAD_SIZE) {
        showSnackbar("Le fichier dépasse la taille maximale autorisée.");
        return;
      }
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
      setVersion("");
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
      setPreviewItems([]);
      setTextPreview("");
      setWordCount(null);
      setPageCount(null);
      setPreviewError("");
      return;
    }

    if (!titleTouched) {
      setTitle(titleFromFileName(file.name));
    }

    void buildPreview(file);
  }

  async function handleSubmit() {
    if (!selectedFile) {
      const message = "Choisissez un document avant de lancer l’indexation.";
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
        version,
        relationType,
        relatedDocumentId: relationType === "none" ? undefined : relatedDocumentId,
      });
      setIsIndexed(true);
      showSnackbar("Document indexé avec succès.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue pendant l indexation.";
      setSubmitError(message);
      showSnackbar(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setCategory("finance");
    setTitle("");
    setDocumentType("");
    setDatePublication("");
    setDateEntreeVigueur("");
    setVersion("");
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
  }

  const fileMeta: FileMeta | null = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

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
      label: "Fichier en cours d indexation",
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
      .filter((document) =>
        !normalizedSearch
          ? true
          : document.title.toLowerCase().includes(normalizedSearch),
      )
      .slice(0, 80)
      .map((document) => ({
        id: document.id,
        title: `${document.title} (${document.createdAt.slice(0, 10)})`,
      }));
  }, [availableDocuments, relationSearch]);

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
          <header className="px-3 py-1">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="px-2 text-xl font-bold capitalize tracking-tight text-black">
                Import <span className="text-red-700">document</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-[#eef2f8] px-2 py-0.5 text-[10px] font-semibold text-[#071f3d]">
                  {selectedFile ? fileMeta?.extensionLabel : "Aucun fichier"}
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-[#f5e6e7] px-2 py-0.5 text-[10px] font-semibold text-[#9d0208]">
                  {isIndexed ? "Indexé" : isSubmitting ? "Indexation" : "En attente"}
                </span>
              </div>
            </div>
          </header>

          <main className="space-y-4 px-2 py-3">
            <div className="grid gap-4 lg:grid-cols-[1fr_310px] xl:grid-cols-[1fr_340px]">
              <div className="min-w-0">
                <div className="space-y-4">
                  <UploadZone
                    file={selectedFile}
                    isBusy={isGeneratingPreview || isSubmitting}
                    onFileSelect={handleFileSelect}
                  />
                  <DocumentForm
                    category={category}
                    categoryOptions={categoryOptions}
                    title={title}
                    documentType={documentType}
                    documentTypeOptions={legalDocumentTypeOptions}
                    datePublication={datePublication}
                    dateEntreeVigueur={dateEntreeVigueur}
                    version={version}
                    relationType={relationType}
                    relationTypeOptions={legalRelationTypeOptions}
                    relatedDocumentId={relatedDocumentId}
                    relatedDocumentOptions={relatedDocumentOptions}
                    relationSearch={relationSearch}
                    fileMeta={fileMeta}
                    errors={fieldErrors}
                    onCategoryChange={setCategory}
                    onTitleChange={(value) => {
                      setTitleTouched(true);
                      setTitle(value);
                      setFieldErrors((current) => ({ ...current, title: "" }));
                    }}
                    onDocumentTypeChange={(value) => {
                      setDocumentType(value);
                      setFieldErrors((current) => ({ ...current, documentType: "" }));
                    }}
                    onDatePublicationChange={(value) => {
                      setDatePublication(value);
                      setFieldErrors((current) => ({ ...current, datePublication: "" }));
                    }}
                    onDateEntreeVigueurChange={(value) => {
                      setDateEntreeVigueur(value);
                      setFieldErrors((current) => ({ ...current, dateEntreeVigueur: "" }));
                    }}
                    onVersionChange={setVersion}
                    onRelationTypeChange={(value) => {
                      setRelationType(value);
                      if (value === "none") {
                        setRelatedDocumentId("");
                      }
                    }}
                    onRelatedDocumentIdChange={(value) => {
                      setRelatedDocumentId(value);
                      setFieldErrors((current) => ({ ...current, relatedDocumentId: "" }));
                    }}
                    onRelationSearchChange={setRelationSearch}
                    onFieldBlur={handleFieldBlur}
                    onClearFile={() => handleFileSelect(null)}
                  />
                </div>
              </div>

              <div className="min-w-0">
                <div className="space-y-4">
                  <PreviewPanel
                    fileName={selectedFile?.name ?? "Aucun fichier sélectionné"}
                    fileTypeLabel={fileMeta?.extensionLabel ?? "FILE"}
                    pageCount={pageCount}
                    fileSizeLabel={fileMeta?.sizeLabel ?? "0 B"}
                    previewItems={previewItems}
                    textPreview={textPreview}
                    wordCount={wordCount}
                    isLoading={isGeneratingPreview}
                    message={previewError}
                  />
                  <ProgressPanel steps={steps} />
                </div>
                <div className="mt-4 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded border border-[#e5eaf2] bg-white px-3 py-2 text-[12px] font-semibold text-[#071f3d] transition hover:border-[#071f3d]"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!selectedFile || isSubmitting || isGeneratingPreview}
                    className="rounded bg-[#9d0208] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#8a0207] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Indexation..." : "Indexer"}
                  </button>
                </div>
              </div>
            </div>
          </main>
          <Snackbar
            open={snackbar.open}
            message={snackbar.message}
            tone={snackbar.tone}
            onClose={closeSnackbar}
          />
    </div>
  );
}
