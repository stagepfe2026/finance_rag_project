import { useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

import UploadZone from "../components/import-document/UploadZone";
import DocumentForm from "../components/import-document/DocumentForm";
import ProgressPanel from "../components/import-document/ProgressPanel";
import PreviewPanel from "../components/import-document/PreviwPanel";
import AdminPageShell from "../components/layout/AdminPageShell";
import {
  categoryOptions,
  legalDocumentTypeOptions,
  legalRelationTypeOptions,
  legalStatusOptions,
  type CategoryValue,
  type FileMeta,
  type LegalDocumentTypeValue,
  type LegalRelationTypeValue,
  type LegalStatusValue,
  type PreviewItem,
  type ProgressStep,
} from "../../models/import-document";
import { fetchDocuments, indexDocument } from "../../services/documents.service";
import type { DocumentItem } from "../../models/document";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

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
    const viewport = page.getViewport({ scale: 0.45 });
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
  const [description, setDescription] = useState("");
  const [legalStatus, setLegalStatus] = useState<LegalStatusValue>("actif");
  const [documentType, setDocumentType] = useState<LegalDocumentTypeValue>("autre");
  const [datePublication, setDatePublication] = useState("");
  const [dateEntreeVigueur, setDateEntreeVigueur] = useState("");
  const [version, setVersion] = useState("");
  const [relationType, setRelationType] = useState<LegalRelationTypeValue>("none");
  const [relatedDocumentId, setRelatedDocumentId] = useState("");
  const [relationSearch, setRelationSearch] = useState("");
  const [availableDocuments, setAvailableDocuments] = useState<DocumentItem[]>([]);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [previewError, setPreviewError] = useState<string>("");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isIndexed, setIsIndexed] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const previewUrlsRef = useRef<string[]>([]);

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
    setPageCount(null);
    setPreviewError("");
    setIsGeneratingPreview(true);

    if (file.type !== "application/pdf") {
      setPageCount(null);
      setIsGeneratingPreview(false);
      setPreviewError("La prévisualisation détaillée est disponible pour les PDF.");
      return;
    }

    try {
      const preview = await buildPdfPreview(file);
      previewUrlsRef.current = preview.previewItems.map((item) => item.imageUrl);
      setPreviewItems(preview.previewItems);
      setPageCount(preview.pageCount);
    } catch (error) {
      console.error(error);
      setPreviewError("Impossible de générer la prévisualisation du PDF.");
    } finally {
      setIsGeneratingPreview(false);
    }
  }

  function handleFileSelect(file: File | null) {
    setSubmitError("");
    setIsIndexed(false);
    setSelectedFile(file);
    setDescription("");
    setRelationType("none");
    setRelatedDocumentId("");
    setRelationSearch("");

    if (!file) {
      setTitle("");
      setTitleTouched(false);
      setLegalStatus("actif");
      setDocumentType("autre");
      setDatePublication("");
      setDateEntreeVigueur("");
      setVersion("");
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
      setPreviewItems([]);
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
      setSubmitError("Choisissez un document avant de lancer l indexation.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);
    setIsIndexed(false);

    try {
      if (relationType !== "none" && !relatedDocumentId) {
        setSubmitError("Selectionnez le document concerne par la relation juridique.");
        return;
      }

      await indexDocument({
        apiBaseUrl,
        file: selectedFile,
        category,
        title,
        description,
        legalStatus,
        documentType,
        datePublication: datePublication || undefined,
        dateEntreeVigueur: dateEntreeVigueur || undefined,
        version,
        relationType,
        relatedDocumentId: relationType === "none" ? undefined : relatedDocumentId,
      });
      setIsIndexed(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue pendant l indexation.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setCategory("finance");
    setTitle("");
    setDescription("");
    setLegalStatus("actif");
    setDocumentType("autre");
    setDatePublication("");
    setDateEntreeVigueur("");
    setVersion("");
    setRelationType("none");
    setRelatedDocumentId("");
    setRelationSearch("");
    setPreviewItems([]);
    setPageCount(null);
    setPreviewError("");
    setIsGeneratingPreview(false);
    setIsSubmitting(false);
    setSubmitError("");
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
        : previewError
          ? "Prévisualisation limitée"
          : "Analyse en cours",
    };
  }, [pageCount, previewError, selectedFile]);

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
          : document.title.toLowerCase().includes(normalizedSearch) ||
            document.description.toLowerCase().includes(normalizedSearch),
      )
      .slice(0, 80)
      .map((document) => ({
        id: document.id,
        title: `${document.title} (${document.createdAt.slice(0, 10)})`,
      }));
  }, [availableDocuments, relationSearch]);

  return (
    <AdminPageShell>
          <header className="bg-[#f7f9fc] px-7 py-5">
            <div>
              <h1 className="text-[26px] font-bold tracking-tight text-[#273043]">
                Import <span className="text-[#9d0208]">Document</span>
              </h1>
              <p className="mt-2 text-[13px] text-[#5f6680]">
                Upload and index your PDF or DOCX files to enrich the knowledge base.
              </p>
            </div>
          </header>

          <section className="px-5 pb-5 md:px-7">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 xl:col-span-7">
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
                    description={description}
                    legalStatus={legalStatus}
                    legalStatusOptions={legalStatusOptions}
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
                    onCategoryChange={setCategory}
                    onTitleChange={(value) => {
                      setTitleTouched(true);
                      setTitle(value);
                    }}
                    onDescriptionChange={setDescription}
                    onLegalStatusChange={setLegalStatus}
                    onDocumentTypeChange={setDocumentType}
                    onDatePublicationChange={setDatePublication}
                    onDateEntreeVigueurChange={setDateEntreeVigueur}
                    onVersionChange={setVersion}
                    onRelationTypeChange={(value) => {
                      setRelationType(value);
                      if (value === "none") {
                        setRelatedDocumentId("");
                      }
                    }}
                    onRelatedDocumentIdChange={setRelatedDocumentId}
                    onRelationSearchChange={setRelationSearch}
                    onClearFile={() => handleFileSelect(null)}
                  />
                </div>
              </div>

              <div className="col-span-12 xl:col-span-5">
                <div className="space-y-4">
                  <PreviewPanel
                    fileName={selectedFile?.name ?? "Aucun fichier sélectionné"}
                    fileTypeLabel={fileMeta?.extensionLabel ?? "FILE"}
                    pageCount={pageCount}
                    fileSizeLabel={fileMeta?.sizeLabel ?? "0 B"}
                    previewItems={previewItems}
                    isLoading={isGeneratingPreview}
                    message={previewError}
                  />
                  <ProgressPanel steps={steps} />
                </div>
                <div className="mt-6 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-[12px] font-medium text-[#111111] transition hover:bg-gray-50"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!selectedFile || isSubmitting || isGeneratingPreview}
                    className="rounded-lg bg-[#9d0208] px-4 py-2 text-[12px] font-medium text-white transition hover:bg-[#9d0208] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Indexation..." : "Indexer"}
                  </button>
                </div>
              </div>
            </div>
          </section>
    </AdminPageShell>
  );
}
