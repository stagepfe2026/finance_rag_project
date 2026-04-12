import { useEffect, useMemo, useState } from "react";
import DocumentsFilterBar from "../components/list-documents/DocumentsFilterBar";
import DocumentsPageHeader from "../components/list-documents/DocumentsPageHeader";
import AdminSidebar from "../components/layout/AdminSidebar";
import DocumentsStatusSummary from "../components/list-documents/DocumentsStatusSummary";
import DocumentsTable from "../components/list-documents/DocumentsTable";
import DocumentsPagination from "../components/list-documents/DocumentsPagination";
import DocumentPreviewAside from "../components/list-documents/DocumentPreviewAside";
import {
  deleteDocumentFromIndex,
  fetchDocumentPreview,
  fetchDocuments,
  reindexDocument,
} from "../../services/documents.service";
import type {
  DocumentCategoryValue,
  DocumentItem,
  DocumentPreview,
  DocumentStatusValue,
} from "../../models/document";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const emptyPreview: DocumentPreview = {
  id: "",
  title: "Consultation du document",
  category: "other",
  description: "",
  fileType: "",
  createdAt: new Date().toISOString(),
  content: "",
};
function formatDocumentDate(document: DocumentItem) {
  const rawDate = document.realizedAt || document.indexedAt || document.createdAt;
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

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "-";

  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
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
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function makeFilename(extension: "pdf" | "xlsx") {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `documents-export-${sanitizeFilenamePart(stamp)}.${extension}`;
}

export default function ListDocumentPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | DocumentCategoryValue>("all");
  const [status, setStatus] = useState<"all" | DocumentStatusValue>("all");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [previewDocument, setPreviewDocument] = useState<DocumentPreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setIsLoading(true);
      setError("");

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
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Erreur pendant le chargement des documents.",
          );
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
  }, [search, category, status]);

  const indexedCount = useMemo(
    () => documents.filter((document) => document.documentStatus === "indexed").length,
    [documents],
  );
  const processingCount = useMemo(
    () => documents.filter((document) => document.documentStatus === "processing").length,
    [documents],
  );
  const failedCount = useMemo(
    () => documents.filter((document) => document.documentStatus === "failed").length,
    [documents],
  );

  const handleReset = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
  };

  const handleClosePreview = () => {
    setPreviewDocument(null);
    setPreviewError("");
    setIsPreviewLoading(false);
  };

  const handleConsultDocument = async (document: DocumentItem) => {
    const normalizedType = document.fileType.toLowerCase();
    if (normalizedType.includes("pdf")) {
      window.open(`${apiBaseUrl}/api/v1/documents/${document.id}/file`, "_blank", "noopener,noreferrer");
      return;
    }

    setPreviewDocument({
      ...emptyPreview,
      id: document.id,
      title: document.title,
      category: document.category,
      description: document.description,
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
    try {
      setError("");
      const result = await deleteDocumentFromIndex({
        apiBaseUrl,
        documentId: document.id,
      });
      if (result.data) {
        setDocuments((current) =>
          current.map((item) => (item.id === document.id ? result.data ?? item : item)),
        );
      }
      setActionMessage(result.message);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Erreur pendant la suppression de l index du document.",
      );
    }
  }

  async function handleReindex(document: DocumentItem) {
    try {
      setError("");
      const result = await reindexDocument({
        apiBaseUrl,
        documentId: document.id,
      });
      if (result.data) {
        setDocuments((current) =>
          current.map((item) => (item.id === document.id ? result.data ?? item : item)),
        );
      }
      setActionMessage(result.message);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Erreur pendant la reindexation du document.",
      );
    }
  }

  function handleExportPdf() {
  try {
    setError("");
    setActionMessage("");
    setIsExportingPdf(true);

    const rows = documents.map((document) => ({
      title: document.title || "-",
      description: document.description || "-",
      category: document.category || "-",
      status: document.documentStatus || "-",
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

    const categoryLabel =
      category === "all" ? "Toutes les catégories" : category;

    const statusLabel =
      status === "all" ? "Tous les statuts" : status;

    const drawHeader = (pageNumber: number) => {
      doc.setFillColor(...colors.red);
      doc.rect(marginLeft, 20, pageWidth - marginLeft - marginRight, 4, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...colors.black);
      doc.text("Export des documents indexés", marginLeft, 50);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colors.gray);
      doc.text(`Page ${pageNumber}`, pageWidth - 72, 50);

      doc.setFontSize(10);
      doc.setTextColor(...colors.darkGray);
      doc.text("Rapport de la liste des documents", marginLeft, 68);

      doc.setFontSize(8);
      doc.setTextColor(...colors.gray);
      doc.text(`Généré le ${generatedAt}`, marginLeft, 84);

      const cardY = 104;
      const cardH = 34;

      const cards = [
        { label: "Documents", value: String(documents.length), x: marginLeft, w: 100 },
        { label: "Catégorie", value: categoryLabel, x: marginLeft + 112, w: 150 },
        { label: "Statut", value: statusLabel, x: marginLeft + 274, w: 120 },
      ];

      cards.forEach((card) => {
        doc.setDrawColor(...colors.border);
        doc.setFillColor(...colors.white);
        doc.roundedRect(card.x, cardY, card.w, cardH, 4, 4, "FD");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...colors.gray);
        doc.text(card.label, card.x + 8, cardY + 11);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...colors.black);
        const lines = doc.splitTextToSize(card.value, card.w - 16);
        doc.text(lines.slice(0, 1), card.x + 8, cardY + 24);
      });

      const searchY = 148;
      const searchH = 34;

      doc.setDrawColor(...colors.border);
      doc.setFillColor(...colors.white);
      doc.roundedRect(
        marginLeft,
        searchY,
        pageWidth - marginLeft - marginRight,
        searchH,
        4,
        4,
        "FD",
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...colors.gray);
      doc.text("Recherche", marginLeft + 10, searchY + 11);

      doc.setFontSize(8);
      doc.setTextColor(...colors.black);
      const searchLines = doc.splitTextToSize(
        search.trim() || "Aucune recherche",
        pageWidth - marginLeft - marginRight - 20,
      );
      doc.text(searchLines.slice(0, 1), marginLeft + 10, searchY + 24);
    };

    autoTable(doc, {
      startY: 198,
      margin: { left: marginLeft, right: marginRight, top: 198, bottom: 34 },
      head: [["Document", "Catégorie", "Statut", "Date", "Type", "Taille"]],
      body:
        rows.length > 0
          ? rows.map((row) => [
              `${row.title}\n${row.description !== "-" ? row.description : ""}`.trim(),
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
      didParseCell: (data: any) => {
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
    setActionMessage("Le rapport PDF a été généré et téléchargé.");
  } catch (exportError) {
    setError(
      exportError instanceof Error
        ? exportError.message
        : "Erreur pendant la génération du PDF.",
    );
  } finally {
    setIsExportingPdf(false);
  }
}

function handleExportExcel() {
  try {
    setError("");
    setActionMessage("");
    setIsExportingExcel(true);

    const rows = documents.map((document) => ({
      Document: document.title || "-",
      Description: document.description || "-",
      Categorie: document.category || "-",
      Statut: document.documentStatus || "-",
      Date: formatDocumentDate(document),
      Type: normalizeFileType(document.fileType || "-"),
      Taille: formatFileSize(document.fileSize),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Documents");

    XLSX.writeFile(workbook, makeFilename("xlsx"));
    setActionMessage("Le fichier Excel a été généré et téléchargé.");
  } catch (exportError) {
    setError(
      exportError instanceof Error
        ? exportError.message
        : "Erreur pendant la génération du fichier Excel.",
    );
  } finally {
    setIsExportingExcel(false);
  }
}

  return (
    <div className="min-h-screen bg-[#f7f4f3] text-[#111111]">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <main className="flex-1">
          <header className="border-b border-[#ede7e5] bg-[#fbf8f7] px-7 py-5">
            <DocumentsPageHeader
              onExportPdf={handleExportPdf}
              onExportExcel={handleExportExcel}
              isExportingPdf={isExportingPdf}
              isExportingExcel={isExportingExcel}
            />
          </header>

          <section className="px-5 py-5 md:px-7">
            <div className="space-y-3">
              <DocumentsFilterBar
                search={search}
                category={category}
                status={status}
                total={total}
                onSearchChange={setSearch}
                onCategoryChange={setCategory}
                onStatusChange={setStatus}
                onReset={handleReset}
              />

              <DocumentsStatusSummary
                indexed={indexedCount}
                processing={processingCount}
                failed={failedCount}
              />

              {error ? (
                <div className="rounded-2xl border border-[#f1d2d0] bg-[#fff8f7] px-4 py-3 text-[12px] text-[#b42318]">
                  {error}
                </div>
              ) : null}

              {actionMessage ? (
                <div className="rounded-2xl border border-[#d9ebe1] bg-[#f4fbf7] px-4 py-3 text-[12px] text-[#157347]">
                  {actionMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                <div className="min-w-0 flex-1 space-y-3">
                  {isLoading ? (
                    <div className="rounded-2xl border border-[#ede7e5] bg-white px-4 py-6 text-[12px] text-[#7a7472]">
                      Chargement des documents...
                    </div>
                  ) : documents.length > 0 ? (
                    <DocumentsTable
                      documents={documents}
                      onConsult={handleConsultDocument}
                      onDeleteFromIndex={handleDeleteFromIndex}
                      onReindex={handleReindex}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#d8d1d1] bg-white px-4 py-6 text-[12px] text-[#7a7472]">
                      Aucun document trouve.
                    </div>
                  )}

                  <DocumentsPagination total={total} />
                </div>

                {previewDocument ? (
                  <DocumentPreviewAside
                    preview={previewDocument}
                    isLoading={isPreviewLoading}
                    error={previewError}
                    onClose={handleClosePreview}
                  />
                ) : null}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
