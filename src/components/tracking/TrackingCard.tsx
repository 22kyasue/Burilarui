import { useNavigate } from 'react-router-dom';
import type { TrackingListItem } from '../../types/tracking';
import { Pin, Circle } from 'lucide-react';

interface TrackingCardProps {
  tracking: TrackingListItem;
}

export default function TrackingCard({ tracking }: TrackingCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/tracking/${tracking.id}`)}
      className="w-full text-left rounded-lg border bg-white p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {tracking.isPinned && <Pin className="h-3 w-3 text-amber-500 flex-shrink-0" />}
            <h3 className="font-medium text-gray-900 truncate">{tracking.title}</h3>
          </div>
          {tracking.description && (
            <p className="mt-1 text-sm text-gray-500 truncate">{tracking.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
            <span className={`flex items-center gap-1 ${tracking.isActive ? 'text-green-600' : 'text-gray-400'}`}>
              <Circle className={`h-2 w-2 ${tracking.isActive ? 'fill-green-500' : 'fill-gray-300'}`} />
              {tracking.isActive ? 'Active' : 'Paused'}
            </span>
            <span>{tracking.frequency}</span>
            <span>{tracking.updateCount} updates</span>
          </div>
        </div>
        {tracking.unreadCount > 0 && (
          <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs text-white">
            {tracking.unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}
