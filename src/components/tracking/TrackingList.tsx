import type { TrackingListItem } from '../../types/tracking';
import TrackingCard from './TrackingCard';
import { Skeleton } from '../ui/skeleton';

interface TrackingListProps {
  trackings: TrackingListItem[];
  loading: boolean;
}

export default function TrackingList({ trackings, loading }: TrackingListProps) {
  if (loading && trackings.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-lg border bg-white p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (trackings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">No trackings yet</p>
        <p className="text-sm mt-1">Search for a topic above to start tracking</p>
      </div>
    );
  }

  // Sort: pinned first, then by updatedAt desc
  const sorted = [...trackings].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="space-y-3">
      {sorted.map(tracking => (
        <TrackingCard key={tracking.id} tracking={tracking} />
      ))}
    </div>
  );
}
