import type { TrackingWithUpdates, UpdateTrackingRequest } from '../../types/tracking';
import UpdateItem from './UpdateItem';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { ArrowLeft, RefreshCw, Loader2, Pin, Pause, Play, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface TrackingDetailProps {
  tracking: TrackingWithUpdates | null;
  loading: boolean;
  error: string | null;
  onUpdate: (data: UpdateTrackingRequest) => Promise<unknown>;
  onDelete: () => Promise<void>;
  onExecute: () => Promise<unknown>;
  onMarkAllRead: () => Promise<void>;
}

export default function TrackingDetail({
  tracking,
  loading,
  error,
  onUpdate,
  onDelete,
  onExecute,
  onMarkAllRead,
}: TrackingDetailProps) {
  const navigate = useNavigate();
  const [executing, setExecuting] = useState(false);

  if (loading && !tracking) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Tracking not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const handleExecute = async () => {
    setExecuting(true);
    try {
      await onExecute();
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{tracking.title}</h1>
          {tracking.description && (
            <p className="text-sm text-gray-500 mt-1">{tracking.description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdate({ isPinned: !tracking.isPinned })}
        >
          <Pin className={`h-4 w-4 mr-1 ${tracking.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
          {tracking.isPinned ? 'Unpin' : 'Pin'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdate({ isActive: !tracking.isActive })}
        >
          {tracking.isActive ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
          {tracking.isActive ? 'Pause' : 'Resume'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExecute} disabled={executing}>
          {executing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Refresh
        </Button>
        {tracking.unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={onMarkAllRead}>
            Mark all read
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete tracking?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{tracking.title}" and all its updates. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-4 text-sm rounded-lg border p-4 bg-white">
        <div>
          <span className="text-gray-500">Status:</span>{' '}
          <span className={tracking.isActive ? 'text-green-600' : 'text-gray-400'}>
            {tracking.isActive ? 'Active' : 'Paused'}
          </span>
        </div>
        <div><span className="text-gray-500">Frequency:</span> {tracking.frequency}</div>
        <div><span className="text-gray-500">Updates:</span> {tracking.updateCount}</div>
        <div><span className="text-gray-500">Query:</span> {tracking.query}</div>
      </div>

      {/* Updates Timeline */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Updates</h2>
        {tracking.updates.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No updates yet. Click Refresh to check for updates.</p>
        ) : (
          tracking.updates.map(update => (
            <UpdateItem key={update.id} update={update} />
          ))
        )}
      </div>
    </div>
  );
}
