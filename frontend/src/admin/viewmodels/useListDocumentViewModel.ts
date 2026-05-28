import { useCallback, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import {
  deleteDocumentFromIndex,
  fetchDocumentPreview,
  fetchDocuments,
  reindexDocument,
} from "../../services/documents.service";
import { formatFileSize } from "../utils/formatUtils";
import type {
  DocumentCategoryValue,
  DocumentItem,
  DocumentPreview,
  DocumentStatusValue,
} from "../../models/document";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const emptyPreview: DocumentPreview = {
  id: "",
  title: "Consultation du document",
  category: "other",
  legalStatus: "actif",
  legalType: "autre",
  datePublication: null,
  dateEntreeVigueur: null,
  relationToTarget: "none",
  targetDocumentId: null,
  fileType: "",
  createdAt: new Date().toISOString(),
  extractedText: "",
};

// ─── Pure helper functions ────────────────────────────────────────────────────
function formatDocumentDate(document: DocumentItem) {
  const rawDate = document.issuedAt || document.indexedAt || document.createdAt;
  if (!rawDate) return "-";

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function formatDateTime(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}


function normalizeFileType(fileType: string) {
  const value = (fileType || "").toLowerCase();

  if (value.includes("pdf")) return "PDF";
  if (value.includes("word") || value.includes("docx") || value.includes("doc")) return "DOCX";
  if (
    value.includes("excel") ||
    value.includes("sheet") ||
    value.includes("xlsx") ||
    value.includes("xls")
  ) {
    return "XLS";
  }

  return value ? value.toUpperCase().slice(0, 10) : "-";
}

function sanitizeFilenamePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function makeFilename(extension: "pdf" | "xlsx") {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `documents-export-${sanitizeFilenamePart(stamp)}.${extension}`;
}

// ─── ViewModel ───────────────────────────────────────────────────────────────
export function useListDocumentViewModel() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | DocumentCategoryValue>("all");
  const [status, setStatus] = useState<"all" | DocumentStatusValue>("all");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", tone: "info" as "success" | "error" | "info" });
  const closeSnackbar = useCallback(() => setSnackbar((s) => ({ ...s, open: false })), []);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [previewDocument, setPreviewDocument] = useState<DocumentPreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentItem | null>(null);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);
  const [documentToReindex, setDocumentToReindex] = useState<DocumentItem | null>(null);
  const [isReindexingDocument, setIsReindexingDocument] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setIsLoading(true);
      closeSnackbar();

      try {
        const response = await fetchDocuments({
          apiBaseUrl,
          search,
          category,
          status,
        });

        if (!cancelled) {
          setDocuments(response.items);
          setTotal(response.total);
        }
      } catch (loadError) {
        if (!cancelled) {
          setDocuments([]);
          setTotal(0);
          setSnackbar({
            open: true,
            tone: "error",
            message: loadError instanceof Error ? loadError.message : "Erreur pendant le chargement des documents.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [search, category, status, closeSnackbar]);

  const indexedCount = useMemo(
    () => documents.filter((document) => document.status === "indexed").length,
    [documents],
  );
  const processingCount = useMemo(
    () => documents.filter((document) => document.status === "processing").length,
    [documents],
  );
  const failedCount = useMemo(
    () => documents.filter((document) => document.status === "failed").length,
    [documents],
  );

  const handleReset = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
  };

  const handleClosePreview = () => {
    setSelectedDocument(null);
    setPreviewDocument(null);
    setPreviewError("");
    setIsPreviewLoading(false);
  };

  const handleConsultDocument = async (document: DocumentItem) => {
    setSelectedDocument(document);
    const normalizedType = document.fileType.toLowerCase();

    if (normalizedType.includes("pdf")) {
      setPreviewDocument(null);
      return;
    }

    setPreviewDocument({
      ...emptyPreview,
      id: document.id,
      title: document.title,
      category: document.category,
      fileType: document.fileType,
      createdAt: document.createdAt,
    });
    setPreviewError("");
    setIsPreviewLoading(true);

    try {
      const preview = await fetchDocumentPreview({
        apiBaseUrl,
        documentId: document.id,
      });
      setPreviewDocument(preview);
    } catch (previewLoadError) {
      setPreviewError(
        previewLoadError instanceof Error
          ? previewLoadError.message
          : "Erreur pendant le chargement de l apercu du document.",
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

  async function handleDeleteFromIndex(document: DocumentItem) {
    setDocumentToDelete(document);
  }

  async function handleConfirmDeleteDocument() {
    if (!documentToDelete) {
      return;
    }

    try {
      setIsDeletingDocument(true);
      closeSnackbar();
      const result = await deleteDocumentFromIndex({
        apiBaseUrl,
        documentId: documentToDelete.id,
      });
      if (result.data) {
        setDocuments((current) =>
          current.map((item) => (item.id === documentToDelete.id ? result.data ?? item : item)),
        );
        setSelectedDocument((current) =>
          current?.id === documentToDelete.id ? result.data ?? current : current,
        );
      }
      setDocumentToDelete(null);
      setSnackbar({ open: true, tone: "success", message: "Document supprimé avec succès." });
    } catch {
      setSnackbar({ open: true, tone: "error", message: "Impossible de supprimer le document. Veuillez réessayer." });
    } finally {
      setIsDeletingDocument(false);
    }
  }

  async function handleReindex(document: DocumentItem) {
    setDocumentToReindex(document);
  }

  async function handleConfirmReindexDocument() {
    if (!documentToReindex) {
      return;
    }

    try {
      setIsReindexingDocument(true);
      closeSnackbar();
      const result = await reindexDocument({
        apiBaseUrl,
        documentId: documentToReindex.id,
      });
      if (result.data) {
        setDocuments((current) =>
          current.map((item) => (item.id === documentToReindex.id ? result.data ?? item : item)),
        );
        setSelectedDocument((current) =>
          current?.id === documentToReindex.id ? result.data ?? current : current,
        );
      }
      setDocumentToReindex(null);
      setSnackbar({ open: true, tone: "success", message: "Document réindexé avec succès." });
    } catch {
      setSnackbar({ open: true, tone: "error", message: "Impossible de réindexer le document. Veuillez réessayer." });
    } finally {
      setIsReindexingDocument(false);
    }
  }

  function handleExportPdf() {
    try {
      closeSnackbar();
      setIsExportingPdf(true);

      const rows = documents.map((document) => ({
        title: document.title || "-",
        category: document.category || "-",
        status: document.status || "-",
        date: formatDocumentDate(document),
        fileType: normalizeFileType(document.fileType || "-"),
        fileSize: formatFileSize(document.fileSize),
      }));

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const generatedAt = formatDateTime(new Date().toISOString());
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 34;
      const marginRight = 34;

      const colors = {
        red: [191, 30, 46] as [number, number, number],
        black: [18, 18, 18] as [number, number, number],
        darkGray: [85, 85, 85] as [number, number, number],
        gray: [125, 125, 125] as [number, number, number],
        lightGray: [245, 245, 245] as [number, number, number],
        rowAlt: [250, 250, 250] as [number, number, number],
        white: [255, 255, 255] as [number, number, number],
        border: [229, 229, 229] as [number, number, number],
      };

      const drawHeader = (pageNumber: number) => {
        doc.setFillColor(...colors.red);
        doc.rect(marginLeft, 20, pageWidth - marginLeft - marginRight, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...colors.black);
        doc.text("Liste des documents indexés", marginLeft, 46);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...colors.gray);
        doc.text(`Généré le ${generatedAt}`, marginLeft, 60);
        doc.text(`Page ${pageNumber}`, pageWidth - 72, 46);
      };

      autoTable(doc, {
        startY: 76,
        margin: { left: marginLeft, right: marginRight, top: 76, bottom: 34 },
        head: [["Document", "Catégorie", "Statut", "Date", "Type", "Taille"]],
        body:
          rows.length > 0
            ? rows.map((row) => [
                row.title,
                row.category,
                row.status,
                row.date,
                row.fileType,
                row.fileSize,
              ])
            : [["Aucun document à exporter", "", "", "", "", ""]],
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
          textColor: colors.black,
          valign: "middle",
          overflow: "linebreak",
          lineColor: colors.border,
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: colors.lightGray,
          textColor: colors.black,
          fontStyle: "bold",
          halign: "left",
          lineColor: colors.border,
          lineWidth: 0.5,
        },
        bodyStyles: {
          fillColor: colors.white,
        },
        alternateRowStyles: {
          fillColor: colors.rowAlt,
        },
        columnStyles: {
          0: { cellWidth: 220 },
          1: { cellWidth: 82 },
          2: { cellWidth: 72 },
          3: { cellWidth: 72 },
          4: { cellWidth: 42, halign: "center" },
          5: { cellWidth: 50, halign: "right" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 2) {
            const value = String(data.cell.raw || "").toLowerCase();

            if (value.includes("indexed")) {
              data.cell.styles.textColor = [20, 20, 20];
              data.cell.styles.fontStyle = "bold";
            } else if (value.includes("processing")) {
              data.cell.styles.textColor = [110, 110, 110];
              data.cell.styles.fontStyle = "bold";
            } else if (value.includes("failed")) {
              data.cell.styles.textColor = [191, 30, 46];
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
        didDrawPage: () => {
          const pageNumber = doc.getCurrentPageInfo().pageNumber;
          drawHeader(pageNumber);

          doc.setDrawColor(...colors.border);
          doc.line(marginLeft, pageHeight - 24, pageWidth - marginRight, pageHeight - 24);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(...colors.gray);
          doc.text(
            "Rapport généré automatiquement depuis la liste des documents.",
            marginLeft,
            pageHeight - 14,
          );
        },
      });

      doc.save(makeFilename("pdf"));
      setSnackbar({ open: true, tone: "success", message: "Le rapport PDF a été généré et téléchargé." });
    } catch (exportError) {
      setSnackbar({
        open: true,
        tone: "error",
        message: exportError instanceof Error ? exportError.message : "Erreur pendant la génération du PDF.",
      });
    } finally {
      setIsExportingPdf(false);
    }
  }

  function handleExportExcel() {
    try {
      closeSnackbar();
      setIsExportingExcel(true);

      const rows = documents.map((document) => ({
        Document: document.title || "-",
        Categorie: document.category || "-",
        Statut: document.status || "-",
        Date: formatDocumentDate(document),
        Type: normalizeFileType(document.fileType || "-"),
        Taille: formatFileSize(document.fileSize),
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Documents");

      XLSX.writeFile(workbook, makeFilename("xlsx"));
      setSnackbar({ open: true, tone: "success", message: "Le fichier Excel a été généré et téléchargé." });
    } catch (exportError) {
      setSnackbar({
        open: true,
        tone: "error",
        message: exportError instanceof Error ? exportError.message : "Erreur pendant la génération du fichier Excel.",
      });
    } finally {
      setIsExportingExcel(false);
    }
  }

  return {
    search,
    setSearch,
    category,
    setCategory,
    status,
    setStatus,
    documents,
    total,
    isLoading,
    snackbar,
    closeSnackbar,
    selectedDocument,
    previewDocument,
    previewError,
    isPreviewLoading,
    isExportingPdf,
    isExportingExcel,
    documentToDelete,
    isDeletingDocument,
    documentToReindex,
    isReindexingDocument,
    indexedCount,
    processingCount,
    failedCount,
    handleReset,
    handleClosePreview,
    handleConsultDocument,
    handleDeleteFromIndex,
    handleConfirmDeleteDocument,
    handleReindex,
    handleConfirmReindexDocument,
    handleExportPdf,
    handleExportExcel,
    setDocumentToDelete,
    setDocumentToReindex,
    apiBaseUrl,
  };
}
