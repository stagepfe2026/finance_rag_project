import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";

import type {
  DocumentCategoryValue,
  DocumentPreview,
  DocumentSearchItem,
} from "../../models/document";
import {
  fetchUserDocumentPreview,
  searchDocuments,
} from "../../services/documents.service";

import RechercheDocumentFilters from "../components/rechercheDocument/RechercheDocumentFilters";
import RechercheDocumentLayout from "../components/rechercheDocument/RechercheDocumentLayout";
import RechercheDocumentPreviewPanel from "../components/rechercheDocument/RechercheDocumentPreviewPanel";
import RechercheDocumentResultsHeader from "../components/rechercheDocument/RechercheDocumentResultsHeader";
import RechercheDocumentResultsList from "../components/rechercheDocument/RechercheDocumentResultsList";
import RechercheDocumentSearchBar from "../components/rechercheDocument/RechercheDocumentSearchBar";
import { useAuth } from "../../auth/AuthContext";
import type { UserLayoutContextValue } from "../layouts/UserLayout";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const RECENT_DOCUMENT_SEARCHES_KEY = "recent-document-searches";
const MAX_RECENT_DOCUMENT_SEARCHES = 5;

export default function RechercheDocumentPage() {
  const { user } = useAuth();
  const { toggleFavoriteDocument } = useOutletContext<UserLayoutContextValue>();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<DocumentCategoryValue[]>([]);
  const [titleFilter, setTitleFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "title">("recent");

  const [results, setResults] = useState<DocumentSearchItem[]>([]);
  const [total, setTotal] = useState(0);

  const [selectedDocument, setSelectedDocument] = useState<DocumentSearchItem | null>(null);
  const [preview, setPreview] = useState<DocumentPreview | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [pageError, setPageError] = useState("");
  const [previewError, setPreviewError] = useState("");
  const recentSearchesStorageKey = useMemo(
    () => `${RECENT_DOCUMENT_SEARCHES_KEY}:${user?.id ?? "anonymous"}`,
    [user?.id],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(recentSearchesStorageKey);
      if (!stored) {
        setRecentSearches([]);
        return;
      }

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((value): value is string => typeof value === "string").slice(0, 5));
      }
    } catch {
      window.localStorage.removeItem(recentSearchesStorageKey);
      setRecentSearches([]);
    }
  }, [recentSearchesStorageKey]);

  useEffect(() => {
    const keyword = query.trim();
    if (!keyword || typeof window === "undefined") {
      return;
    }

    const timer = window.setTimeout(() => {
      setRecentSearches((current) => {
        const next = [keyword, ...current.filter((item) => item.toLowerCase() !== keyword.toLowerCase())].slice(
          0,
          MAX_RECENT_DOCUMENT_SEARCHES,
        );
        window.localStorage.setItem(recentSearchesStorageKey, JSON.stringify(next));
        return next;
      });
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, recentSearchesStorageKey]);

  const filtersSignature = useMemo(
    () =>
      JSON.stringify({
        query,
        selectedCategories,
        titleFilter,
        dateFrom,
        dateTo,
        sortBy,
      }),
    [query, selectedCategories, titleFilter, dateFrom, dateTo, sortBy],
  );

  const requestedDocumentId = searchParams.get("documentId");
  const hasActiveSearch = useMemo(
    () =>
      Boolean(
        requestedDocumentId
        || query.trim()
          || titleFilter.trim()
          || dateFrom
          || dateTo
          || selectedCategories.length > 0,
      ),
    [requestedDocumentId, query, titleFilter, dateFrom, dateTo, selectedCategories],
  );

  useEffect(() => {
    let cancelled = false;

    if (!hasActiveSearch) {
      setResults([]);
      setTotal(0);
      setSelectedDocument(null);
      setPageError("");
      setIsLoading(false);
      return;
    }

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
          sortBy,
          limit: 50,
        });

        if (cancelled) {
          return;
        }

        setResults(response.items);
        setTotal(response.total);

        setSelectedDocument((current) =>
          response.items.find((item) => item.id === requestedDocumentId)
            ?? response.items.find((item) => item.id === current?.id)
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
  }, [filtersSignature, hasActiveSearch, searchParams]);

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
      const nextValue = await toggleFavoriteDocument(item);

      setResults((current) => current.map((entry) => (entry.id === item.id ? { ...entry, isFavored: nextValue } : entry)));
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
    setSortBy("recent");
  }

  return (
    <>
      <RechercheDocumentLayout
        filters={
          <RechercheDocumentFilters
            selectedCategories={selectedCategories}
            titleFilter={titleFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            results={results}
            onCategoriesChange={setSelectedCategories}
            onTitleChange={setTitleFilter}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onReset={handleReset}
          />
        }
        searchBar={
          <RechercheDocumentSearchBar
            query={query}
            recentSearches={recentSearches}
            sortBy={sortBy}
            onQueryChange={setQuery}
            onSortChange={setSortBy}
          />
        }
        resultsHeader={<RechercheDocumentResultsHeader total={total} query={query} error={pageError} />}
        results={
          <RechercheDocumentResultsList
            items={results}
            hasActiveSearch={hasActiveSearch}
            query={query}
            selectedId={selectedDocument?.id ?? null}
            isLoading={isLoading}
            onSelect={setSelectedDocument}
            onToggleFavorite={(item) => void handleToggleFavorite(item)}
          />
        }
        preview={selectedDocument ? (
          <RechercheDocumentPreviewPanel
            item={selectedDocument}
            preview={preview}
            query={query}
            hasActiveSearch={hasActiveSearch}
            isLoading={previewLoading}
            error={previewError}
            apiBaseUrl={apiBaseUrl}
            onClose={() => setSelectedDocument(null)}
            onToggleFavorite={(item) => void handleToggleFavorite(item)}
          />
        ) : null}
      />
    </>
  );
}
