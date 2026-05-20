import { useListDocumentViewModel } from "../viewmodels/useListDocumentViewModel";
import Snackbar from "../components/Snackbar";
import DocumentsFilterBar from "../components/list-documents/DocumentsFilterBar";
import DocumentsPageHeader from "../components/list-documents/DocumentsPageHeader";
import DocumentsStatusSummary from "../components/list-documents/DocumentsStatusSummary";
import DocumentsTable from "../components/list-documents/DocumentsTable";
import DocumentsPagination from "../components/list-documents/DocumentsPagination";
import DocumentPreviewAside from "../components/list-documents/DocumentPreviewAside";

export default function ListDocumentPage() {
  const vm = useListDocumentViewModel();

  return (
    <>
      <header className="bg-[#f7f9fc] px-3 py-1">
        <DocumentsPageHeader
          onExportPdf={vm.handleExportPdf}
          onExportExcel={vm.handleExportExcel}
          isExportingPdf={vm.isExportingPdf}
          isExportingExcel={vm.isExportingExcel}
        />
      </header>

      <section className="px-2 py-1">
        <div className="space-y-3">
          <DocumentsStatusSummary
            indexed={vm.indexedCount}
            processing={vm.processingCount}
            failed={vm.failedCount}
          />

          <DocumentsFilterBar
            search={vm.search}
            category={vm.category}
            status={vm.status}
            total={vm.total}
            onSearchChange={vm.setSearch}
            onCategoryChange={vm.setCategory}
            onStatusChange={vm.setStatus}
            onReset={vm.handleReset}
          />

          <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1 space-y-3">
              {vm.isLoading ? (
                <div className="rounded border border-[#e5eaf2] bg-white px-4 py-6 text-[12px] text-[#5f6680]">
                  Chargement des documents...
                </div>
              ) : vm.documents.length > 0 ? (
                <DocumentsTable
                  documents={vm.documents}
                  onConsult={vm.handleConsultDocument}
                  onDeleteFromIndex={vm.handleDeleteFromIndex}
                  onReindex={vm.handleReindex}
                />
              ) : (
                <div className="rounded border border-dashed border-[#e5eaf2] bg-white px-4 py-6 text-[12px] text-[#5f6680]">
                  Aucun document trouve.
                </div>
              )}

              <DocumentsPagination total={vm.total} />
            </div>

            {vm.selectedDocument ? (
              <DocumentPreviewAside
                document={vm.selectedDocument}
                preview={vm.previewDocument}
                isPreviewLoading={vm.isPreviewLoading}
                previewError={vm.previewError}
                apiBaseUrl={vm.apiBaseUrl}
                onClose={vm.handleClosePreview}
                onReindex={
                  vm.selectedDocument.legalStatus === "actif" || vm.selectedDocument.legalStatus === "remplace"
                    ? () => void vm.handleReindex(vm.selectedDocument!)
                    : undefined
                }
                onDeleteFromIndex={
                  vm.selectedDocument.legalStatus === "actif" || vm.selectedDocument.legalStatus === "remplace"
                    ? () => void vm.handleDeleteFromIndex(vm.selectedDocument!)
                    : undefined
                }
              />
            ) : null}
          </div>
        </div>
      </section>

      {vm.documentToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-lg border border-[#e5eaf2] bg-white shadow-xl">
            <div className="border-b border-[#e5eaf2] px-5 py-4">
              <h2 className="text-sm font-bold text-[#071f3d]">Confirmer la suppression</h2>
            </div>
            <div className="space-y-3 px-5 py-4">
              <p className="text-[13px] leading-6 text-[#3f4960]">
                Voulez-vous vraiment supprimer ce document ? Il ne sera plus utilise dans les reponses, mais restera conserve dans l historique.
              </p>
              <p className="line-clamp-2 rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3 py-2 text-[12px] font-semibold text-[#071f3d]">
                {vm.documentToDelete.title}
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e5eaf2] px-5 py-3">
              <button
                type="button"
                disabled={vm.isDeletingDocument}
                onClick={() => vm.setDocumentToDelete(null)}
                className="rounded border border-[#e5eaf2] bg-white px-3 py-2 text-[12px] font-semibold text-[#071f3d] hover:bg-[#f7f9fc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={vm.isDeletingDocument}
                onClick={() => void vm.handleConfirmDeleteDocument()}
                className="rounded border border-[#9d0208] bg-[#9d0208] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#7f0106] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {vm.isDeletingDocument ? "Suppression..." : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {vm.documentToReindex ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-lg border border-[#e5eaf2] bg-white shadow-xl">
            <div className="border-b border-[#e5eaf2] px-5 py-4">
              <h2 className="text-sm font-bold text-[#071f3d]">Confirmer la reindexation</h2>
            </div>
            <div className="space-y-3 px-5 py-4">
              <p className="text-[13px] leading-6 text-[#3f4960]">
                Voulez-vous vraiment reindexer ce document ?
              </p>
              <p className="line-clamp-2 rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3 py-2 text-[12px] font-semibold text-[#071f3d]">
                {vm.documentToReindex.title}
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e5eaf2] px-5 py-3">
              <button
                type="button"
                disabled={vm.isReindexingDocument}
                onClick={() => vm.setDocumentToReindex(null)}
                className="rounded border border-[#e5eaf2] bg-white px-3 py-2 text-[12px] font-semibold text-[#071f3d] hover:bg-[#f7f9fc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={vm.isReindexingDocument}
                onClick={() => void vm.handleConfirmReindexDocument()}
                className="rounded border border-[#071f3d] bg-[#071f3d] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#0a2d59] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {vm.isReindexingDocument ? "Reindexation..." : "Confirmer la reindexation"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Snackbar
        open={vm.snackbar.open}
        message={vm.snackbar.message}
        tone={vm.snackbar.tone}
        onClose={vm.closeSnackbar}
      />
    </>
  );
}
