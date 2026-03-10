import type { Notification } from '../../types/notifications';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '../ui/button';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: () => void;
  onFeedback: (feedback: 'useful' | 'not_useful') => void;
}

export default function NotificationItem({ notification, onMarkRead, onFeedback }: NotificationItemProps) {
  const navigate = useNavigate();
  const date = new Date(notification.createdAt);
  const timeStr = date.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const handleClick = () => {
    if (!notification.read) onMarkRead();
    if (notification.trackingId) {
      navigate(`/tracking/${notification.trackingId}`);
    }
  };

  return (
    <div
      className={`p-3 cursor-pointer hover:bg-gray-50 ${!notification.read ? 'bg-blue-50/50' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{notification.title}</p>
        <span className="text-xs text-gray-400 whitespace-nowrap">{timeStr}</span>
      </div>
      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
      {notification.type === 'update' && !notification.feedback && (
        <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => onFeedback('useful')}>
            <ThumbsUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => onFeedback('not_useful')}>
            <ThumbsDown className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
