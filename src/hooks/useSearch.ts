import { useState, useCallback } from 'react';
import { search as searchApi } from '../api/search';
import type { SearchResponse } from '../api/search';

export function useSearch() {
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    setIsSearching(true);
    setError(null);
    try {
      const result = await searchApi({ query });
      setSearchResult(result);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSearchResult(null);
    setError(null);
    setIsSearching(false);
  }, []);

  return {
    searchResult,
    isSearching,
    error,
    search,
    reset,
  };
}
