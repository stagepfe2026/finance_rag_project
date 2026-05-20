import { useRechercheDocumentViewModel } from "../viewmodels/useRechercheDocumentViewModel";
import RechercheDocumentFilters from "../components/rechercheDocument/RechercheDocumentFilters";
import RechercheDocumentLayout from "../components/rechercheDocument/RechercheDocumentLayout";
import RechercheDocumentPreviewPanel from "../components/rechercheDocument/RechercheDocumentPreviewPanel";
import RechercheDocumentResultsHeader from "../components/rechercheDocument/RechercheDocumentResultsHeader";
import RechercheDocumentResultsList from "../components/rechercheDocument/RechercheDocumentResultsList";
import RechercheDocumentSearchBar from "../components/rechercheDocument/RechercheDocumentSearchBar";

export default function RechercheDocumentPage() {
  const vm = useRechercheDocumentViewModel();
  return (
    <>
      <RechercheDocumentLayout
        filters={
          <RechercheDocumentFilters
            selectedCategories={vm.selectedCategories}
            titleFilter={vm.titleFilter}
            dateFrom={vm.dateFrom}
            dateTo={vm.dateTo}
            results={vm.results}
            onCategoriesChange={vm.setSelectedCategories}
            onTitleChange={vm.setTitleFilter}
            onDateFromChange={vm.setDateFrom}
            onDateToChange={vm.setDateTo}
            onReset={vm.handleReset}
          />
        }
        searchBar={
          <RechercheDocumentSearchBar
            query={vm.query}
            recentSearches={vm.recentSearches}
            sortBy={vm.sortBy}
            onQueryChange={vm.setQuery}
            onSortChange={vm.setSortBy}
          />
        }
        resultsHeader={<RechercheDocumentResultsHeader total={vm.total} query={vm.query} error={vm.pageError} />}
        results={
          <RechercheDocumentResultsList
            items={vm.results}
            hasActiveSearch={vm.hasActiveSearch}
            query={vm.query}
            selectedId={vm.selectedDocument?.id ?? null}
            isLoading={vm.isLoading}
            onSelect={vm.setSelectedDocument}
            onToggleFavorite={(item) => void vm.handleToggleFavorite(item)}
          />
        }
        preview={vm.selectedDocument ? (
          <RechercheDocumentPreviewPanel
            item={vm.selectedDocument}
            preview={vm.preview}
            query={vm.query}
            hasActiveSearch={vm.hasActiveSearch}
            isLoading={vm.previewLoading}
            error={vm.previewError}
            apiBaseUrl={vm.apiBaseUrl}
            onClose={() => vm.setSelectedDocument(null)}
            onToggleFavorite={(item) => void vm.handleToggleFavorite(item)}
          />
        ) : null}
      />
    </>
  );
}
