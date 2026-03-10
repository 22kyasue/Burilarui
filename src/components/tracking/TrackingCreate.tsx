import { useState } from 'react';
import { useTracking } from '../../hooks/useTracking';
import type { SearchResponse } from '../../api/search';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Loader2, Plus } from 'lucide-react';

interface TrackingCreateProps {
  searchHook: {
    searchResult: SearchResponse | null;
    isSearching: boolean;
    error: string | null;
    search: (query: string) => Promise<SearchResponse | null>;
    reset: () => void;
  };
  onTrackingCreated: () => void;
}

export default function TrackingCreate({ searchHook, onTrackingCreated }: TrackingCreateProps) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const { createTracking } = useTracking();
  const { searchResult, isSearching, error: searchError, search, reset } = searchHook;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    await search(query.trim());
  };

  const handleCreateTracking = async () => {
    if (!query.trim()) return;
    setCreating(true);
    try {
      await createTracking({
        query: query.trim(),
        searchResult: searchResult?.content,
      });
      setQuery('');
      reset();
      onTrackingCreated();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to track?"
          className="flex-1"
          disabled={isSearching}
        />
        <Button type="submit" disabled={isSearching || !query.trim()}>
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      {searchError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{searchError}</div>
      )}

      {searchResult && (
        <div className="rounded-lg border bg-white p-4 space-y-3">
          {searchResult.needsClarification ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-700">Clarification needed:</p>
              <p className="text-sm text-gray-600">{searchResult.reason}</p>
              {searchResult.questions?.map((q, i) => (
                <p key={i} className="text-sm text-gray-700">- {q}</p>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  searchResult.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {searchResult.status === 'in_progress' ? 'Ongoing' : 'Completed'}
                </span>
                {searchResult.statusExplanation && (
                  <span className="text-xs text-gray-500">{searchResult.statusExplanation}</span>
                )}
              </div>

              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {searchResult.content}
              </div>

              {searchResult.status === 'in_progress' && (
                <Button
                  onClick={handleCreateTracking}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Track this topic
                </Button>
              )}

              {searchResult.status === 'completed' && (
                <p className="text-xs text-gray-400">
                  This topic appears completed. Tracking is most useful for ongoing topics.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
