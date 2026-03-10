import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTracking } from '../../hooks/useTracking';
import { useAuth } from '../../context/AuthContext';
import { Plus, Pin, Circle } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

interface SidebarProps {
  onNewTracking?: () => void;
}

export default function Sidebar({ onNewTracking }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { trackings, fetchTrackings } = useTracking();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrackings();
    }
  }, [isAuthenticated, fetchTrackings]);

  const sorted = [...trackings].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const activeId = location.pathname.startsWith('/tracking/')
    ? location.pathname.split('/tracking/')[1]
    : null;

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button
          className="w-full justify-start gap-2"
          variant="outline"
          onClick={() => {
            navigate('/');
            onNewTracking?.();
          }}
        >
          <Plus className="h-4 w-4" />
          New Tracking
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {sorted.map(tracking => (
            <button
              key={tracking.id}
              onClick={() => navigate(`/tracking/${tracking.id}`)}
              className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 ${
                activeId === tracking.id ? 'bg-gray-100 font-medium' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                {tracking.isPinned && <Pin className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                <span className="truncate flex-1">{tracking.title}</span>
                {tracking.unreadCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] text-white">
                    {tracking.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                <Circle className={`h-1.5 w-1.5 ${tracking.isActive ? 'fill-green-500 text-green-500' : 'fill-gray-300 text-gray-300'}`} />
                <span>{tracking.frequency}</span>
              </div>
            </button>
          ))}
          {trackings.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8 px-4">
              No trackings yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
