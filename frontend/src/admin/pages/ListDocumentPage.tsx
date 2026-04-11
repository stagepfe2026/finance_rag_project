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

  return (
    <div className="min-h-screen bg-[#f7f4f3] text-[#111111]">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <main className="flex-1">
          <header className="border-b border-[#ede7e5] bg-[#fbf8f7] px-7 py-5">
            <DocumentsPageHeader />
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
