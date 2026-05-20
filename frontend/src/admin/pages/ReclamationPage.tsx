import { useReclamationViewModel } from "../viewmodels/useReclamationViewModel";
import Snackbar from "../components/Snackbar";
import ReclamationDetailPanel from "../components/réclamation/ReclamationDetailPanel";
import ReclamationFilters from "../components/réclamation/ReclamationFilters";
import ReclamationLayout from "../components/réclamation/ReclamationLayout";
import ReclamationList from "../components/réclamation/ReclamationList";

const PAGE_SIZE = 8;

export default function ReclamationPage() {
  const vm = useReclamationViewModel();
  return (
    <ReclamationLayout stats={vm.stats}>
      <div className="flex min-h-[620px] gap-4">
        <div className="admin-reclamation-list-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#e5eaf2] bg-white">
          <ReclamationFilters
            search={vm.search}
            statusFilter={vm.statusFilter}
            categoryFilter={vm.categoryFilter}
            priorityFilter={vm.priorityFilter}
            onSearchChange={vm.setSearch}
            onStatusFilterChange={vm.setStatusFilter}
            onCategoryFilterChange={vm.setCategoryFilter}
            onPriorityFilterChange={vm.setPriorityFilter}
            onResetFilters={() => {
              vm.setSearch("");
              vm.setStatusFilter("ALL");
              vm.setCategoryFilter("ALL");
              vm.setPriorityFilter("ALL");
            }}
          />

          <ReclamationList
            items={vm.paginatedReclamations}
            selectedId={vm.selectedId}
            showPanel={vm.showPanel}
            isLoading={vm.isLoading}
            onSelect={vm.handleSelectReclamation}
          />

          {!vm.isLoading && vm.filteredReclamations.length > 0 ? (
            <div className="admin-reclamation-pagination flex flex-wrap items-center justify-between gap-3 border-t border-[#e5eaf2] px-4 py-3 text-[12px] text-[#596579]">
              <span>
                Page {vm.safeCurrentPage} / {vm.totalPages} - {vm.filteredReclamations.length} reclamation(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => vm.setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={vm.safeCurrentPage === 1}
                  className="h-8 cursor-pointer rounded border border-[#d8dee9] bg-white px-3 font-semibold text-[#071f3d] transition hover:border-[#071f3d] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Precedent
                </button>
                <button
                  type="button"
                  onClick={() => vm.setCurrentPage((page) => Math.min(vm.totalPages, page + 1))}
                  disabled={vm.safeCurrentPage === vm.totalPages}
                  className="h-8 cursor-pointer rounded border border-[#d8dee9] bg-white px-3 font-semibold text-[#071f3d] transition hover:border-[#071f3d] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Suivant
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {vm.showPanel && vm.selectedReclamation ? (
          <ReclamationDetailPanel
            apiBaseUrl={vm.apiBaseUrl}
            reclamation={vm.selectedReclamation}
            liveStatus={vm.liveStatus}
            isExpanded={vm.isPanelExpanded}
            adminReply={vm.adminReply}
            alreadyHandled={vm.alreadyHandled}
            isSubmitting={vm.isSubmitting}
            isTaking={vm.isTaking}
            onToggleExpanded={() => vm.setIsPanelExpanded((current) => !current)}
            onClose={() => vm.setShowPanel(false)}
            onReplyChange={vm.setAdminReply}
            onSubmitReply={() => void vm.handleSubmitReply()}
            onTakeReclamation={() => void vm.handleTakeReclamation()}
          />
        ) : null}
      </div>
      <Snackbar
        open={vm.snackbar.open}
        message={vm.snackbar.message}
        tone={vm.snackbar.tone}
        onClose={vm.closeSnackbar}
      />
    </ReclamationLayout>
  );
}
