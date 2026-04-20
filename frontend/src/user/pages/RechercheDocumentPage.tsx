import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type {
  DocumentCategoryValue,
  DocumentPreview,
  DocumentSearchItem,
} from "../../models/document";
import {
  fetchUserDocumentPreview,
  searchDocuments,
  setDocumentFavorite,
} from "../../services/documents.service";

import RechercheDocumentLayout from "../components/rechercheDocument/RechercheDocumentLayout";
import RechercheDocumentSearchBar from "../components/rechercheDocument/RechercheDocumentSearchBar";
import RechercheDocumentFilters from "../components/rechercheDocument/RechercheDocumentFilters";
import RechercheDocumentResultsHeader from "../components/rechercheDocument/RechercheDocumentResultsHeader";
import RechercheDocumentResultsList from "../components/rechercheDocument/RechercheDocumentResultsList";
import RechercheDocumentPreviewPanel from "../components/rechercheDocument/RechercheDocumentPreviewPanel";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export default function RechercheDocumentPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [selectedCategories, setSelectedCategories] = useState<DocumentCategoryValue[]>([]);
  const [titleFilter, setTitleFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(searchParams.get("favorites") === "1");
  const [sortBy, setSortBy] = useState<"recent" | "title">("recent");

  const [results, setResults] = useState<DocumentSearchItem[]>([]);
  const [total, setTotal] = useState(0);

  const [selectedDocument, setSelectedDocument] = useState<DocumentSearchItem | null>(null);
  const [preview, setPreview] = useState<DocumentPreview | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [pageError, setPageError] = useState("");
  const [previewError, setPreviewError] = useState("");

  const filtersSignature = useMemo(
    () =>
      JSON.stringify({
        query,
        selectedCategories,
        titleFilter,
        dateFrom,
        dateTo,
        favoritesOnly,
        sortBy,
      }),
    [query, selectedCategories, titleFilter, dateFrom, dateTo, favoritesOnly, sortBy],
  );

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setPageError("");

        const response = await searchDocuments({
          apiBaseUrl,
          query,
          title: titleFilter,
          categories: selectedCategories,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          favoritesOnly,
          sortBy,
          limit: 50,
        });

        if (cancelled) {
          return;
        }

        setResults(response.items);
        setTotal(response.total);

        const requestedDocumentId = searchParams.get("documentId");
        setSelectedDocument((current) =>
          response.items.find((item) => item.id === requestedDocumentId)
          ?? response.items.find((item) => item.id === current?.id)
          ?? response.items[0]
          ?? null,
        );
      } catch (error) {
        if (!cancelled) {
          setPageError(error instanceof Error ? error.message : "Erreur pendant la recherche des documents.");
          setResults([]);
          setTotal(0);
          setSelectedDocument(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [filtersSignature, searchParams]);

  useEffect(() => {
    if (!selectedDocument) {
      setPreview(null);
      setPreviewError("");
      return;
    }

    const documentId = selectedDocument.id;
    let cancelled = false;

    async function loadPreview() {
      try {
        setPreviewLoading(true);
        setPreviewError("");

        const data = await fetchUserDocumentPreview({
          apiBaseUrl,
          documentId,
        });

        if (!cancelled) {
          setPreview(data);
        }
      } catch (error) {
        if (!cancelled) {
          setPreview(null);
          setPreviewError(error instanceof Error ? error.message : "Erreur pendant le chargement du document.");
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [selectedDocument?.id]);

  async function handleToggleFavorite(item: DocumentSearchItem) {
    try {
      const nextValue = !item.isFavored;

      await setDocumentFavorite({
        apiBaseUrl,
        documentId: item.id,
        isFavored: nextValue,
      });

      setResults((current) =>
        current
          .map((entry) => (entry.id === item.id ? { ...entry, isFavored: nextValue } : entry))
          .filter((entry) => (favoritesOnly ? entry.isFavored : true)),
      );

      setSelectedDocument((current) => (current?.id === item.id ? { ...current, isFavored: nextValue } : current));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Erreur pendant la mise a jour du favori.");
    }
  }

  function handleReset() {
    setQuery("");
    setSelectedCategories([]);
    setTitleFilter("");
    setDateFrom("");
    setDateTo("");
    setFavoritesOnly(false);
    setSortBy("recent");
  }

  return (
    <RechercheDocumentLayout
      filters={
        <RechercheDocumentFilters
          selectedCategories={selectedCategories}
          titleFilter={titleFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          favoritesOnly={favoritesOnly}
          results={results}
          onCategoriesChange={setSelectedCategories}
          onTitleChange={setTitleFilter}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onFavoritesOnlyChange={setFavoritesOnly}
          onReset={handleReset}
        />
      }
      searchBar={
        <RechercheDocumentSearchBar query={query} sortBy={sortBy} onQueryChange={setQuery} onSortChange={setSortBy} />
      }
      resultsHeader={<RechercheDocumentResultsHeader total={total} query={query} error={pageError} />}
      results={
        <RechercheDocumentResultsList
          items={results}
          query={query}
          selectedId={selectedDocument?.id ?? null}
          isLoading={isLoading}
          onSelect={setSelectedDocument}
          onToggleFavorite={(item) => void handleToggleFavorite(item)}
        />
      }
      preview={
        <RechercheDocumentPreviewPanel
          item={selectedDocument}
          preview={preview}
          query={query}
          isLoading={previewLoading}
          error={previewError}
          apiBaseUrl={apiBaseUrl}
          onToggleFavorite={(item) => void handleToggleFavorite(item)}
        />
      }
    />
  );
}
