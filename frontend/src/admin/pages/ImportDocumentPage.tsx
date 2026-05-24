import UploadZone from "../components/import-document/UploadZone";
import DocumentForm from "../components/import-document/DocumentForm";
import ProgressPanel from "../components/import-document/ProgressPanel";
import PreviewPanel from "../components/import-document/PreviwPanel";
import Snackbar from "../components/Snackbar";
import { useImportDocumentViewModel } from "../viewmodels/useImportDocumentViewModel";

export default function ImportDocumentPage() {
  const vm = useImportDocumentViewModel();

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <header className="px-3 py-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="px-2 text-xl font-bold capitalize tracking-tight text-black">
            Import <span className="text-red-700">document</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-[#eef2f8] px-2 py-0.5 text-[10px] font-semibold text-[#071f3d]">
              {vm.selectedFile ? vm.fileMeta?.extensionLabel : "Aucun fichier"}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-[#f5e6e7] px-2 py-0.5 text-[10px] font-semibold text-[#9d0208]">
              {vm.isIndexed ? "Indexé" : vm.isSubmitting ? "Indexation" : "En attente"}
            </span>
          </div>
        </div>
      </header>

      <main className="space-y-4 px-2 py-3">
        <div className="grid gap-4 lg:grid-cols-[1fr_310px] xl:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <div className="space-y-4">
              <UploadZone
                file={vm.selectedFile}
                isBusy={vm.isGeneratingPreview || vm.isSubmitting}
                onFileSelect={vm.handleFileSelect}
              />
              <DocumentForm
                category={vm.category}
                categoryOptions={vm.categoryOptions}
                title={vm.title}
                documentType={vm.documentType}
                documentTypeOptions={vm.legalDocumentTypeOptions}
                datePublication={vm.datePublication}
                dateEntreeVigueur={vm.dateEntreeVigueur}
                relationType={vm.relationType}
                relationTypeOptions={vm.legalRelationTypeOptions}
                relatedDocumentId={vm.relatedDocumentId}
                relatedDocumentOptions={vm.relatedDocumentOptions}
                relationSearch={vm.relationSearch}
                fileMeta={vm.fileMeta}
                errors={vm.fieldErrors}
                onCategoryChange={vm.onCategoryChange}
                onTitleChange={vm.handleTitleChange}
                onDocumentTypeChange={vm.handleDocumentTypeChange}
                onDatePublicationChange={vm.handleDatePublicationChange}
                onDateEntreeVigueurChange={vm.handleDateEntreeVigueurChange}
                onRelationTypeChange={vm.handleRelationTypeChange}
                onRelatedDocumentIdChange={vm.handleRelatedDocumentIdChange}
                onRelationSearchChange={vm.onRelationSearchChange}
                onFieldBlur={vm.handleFieldBlur}
                onClearFile={() => vm.handleFileSelect(null)}
              />
            </div>
          </div>

          <div className="min-w-0">
            <div className="space-y-4">
              <PreviewPanel
                fileName={vm.selectedFile?.name ?? "Aucun fichier sélectionné"}
                fileTypeLabel={vm.fileMeta?.extensionLabel ?? "FILE"}
                pageCount={vm.pageCount}
                fileSizeLabel={vm.fileMeta?.sizeLabel ?? "0 B"}
                previewItems={vm.previewItems}
                textPreview={vm.textPreview}
                wordCount={vm.wordCount}
                isLoading={vm.isGeneratingPreview}
                message={vm.previewError}
              />
              <ProgressPanel steps={vm.steps} />
            </div>
            <div className="mt-4 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={vm.handleReset}
                className="rounded border border-[#e5eaf2] bg-white px-3 py-2 text-[12px] font-semibold text-[#071f3d] transition hover:border-[#071f3d]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => void vm.handleSubmit()}
                disabled={!vm.selectedFile || vm.isSubmitting || vm.isGeneratingPreview}
                className="rounded bg-[#9d0208] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#8a0207] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {vm.isSubmitting ? "Indexation..." : "Indexer"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Snackbar
        open={vm.snackbar.open}
        message={vm.snackbar.message}
        tone={vm.snackbar.tone}
        onClose={vm.closeSnackbar}
      />
    </div>
  );
}
