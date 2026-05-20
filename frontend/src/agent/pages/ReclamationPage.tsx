import { useReclamationViewModel } from "../viewmodels/useReclamationViewModel";
import Snackbar from "../components/chat/Snackbar";
import ReclamationForm from "../components/reclamation/create/ReclamationForm";
import ReclamationDesk from "../components/reclamation/ReclamationDesk";

export default function ReclamationPage() {
  const vm = useReclamationViewModel();
  return (
    <>
      <ReclamationDesk
        reclamations={vm.paginatedReclamations}
        selectedReclamation={vm.selectedReclamation}
        search={vm.search}
        statusFilter={vm.statusFilter}
        readFilter={vm.readFilter}
        page={vm.page}
        pageSize={8}
        totalPages={vm.totalPages}
        totalResults={vm.filteredReclamations.length}
        isLoading={vm.isLoading}
        pageError={vm.pageError}
        onSearchChange={vm.setSearch}
        onStatusChange={vm.setStatusFilter}
        onReadFilterChange={vm.setReadFilter}
        onResetFilters={() => {
          vm.setSearch("");
          vm.setStatusFilter("ALL");
          vm.setReadFilter("ALL");
        }}
        onPageChange={vm.setPage}
        onSelect={vm.handleConsult}
        onEdit={vm.openEditModal}
        onDelete={vm.handleAskDelete}
        onRefresh={() => void vm.loadReclamations()}
        onCreate={vm.openCreateModal}
        onCloseDetails={() => vm.setSelectedReclamation(null)}
        onCloseCreate={vm.closeCreateModal}
        deleteTarget={vm.deleteTarget}
        isDeleting={vm.isDeleting}
        onCloseDeleteModal={vm.handleCloseDeleteModal}
        onConfirmDelete={() => void vm.handleConfirmDelete()}
        isCreating={vm.isCreating}
        createForm={(
          <ReclamationForm
            values={vm.formValues}
            errors={vm.formErrors}
            submitError=""
            successMessage=""
            isSubmitting={vm.isSubmitting}
            onChange={vm.updateField}
            onSubmit={() => void (vm.editingReclamation ? vm.handleUpdateSubmit() : vm.handleCreateSubmit())}
            onClose={vm.closeCreateModal}
            modeLabel={vm.editingReclamation ? "Modifier reclamation" : "Nouvelle reclamation"}
          />
        )}
      />

      <Snackbar open={vm.snackbar.open} message={vm.snackbar.message} tone={vm.snackbar.tone} />
    </>
  );
}
