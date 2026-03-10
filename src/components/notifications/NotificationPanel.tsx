import type { Notification } from '../../types/notifications';
import NotificationItem from './NotificationItem';
import { Button } from '../ui/button';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onFeedback: (id: string, feedback: 'useful' | 'not_useful') => void;
}

export default function NotificationPanel({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onFeedback,
}: NotificationPanelProps) {
  const unread = notifications.filter(n => !n.read);

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-medium text-sm">Notifications</h3>
        {unread.length > 0 && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={onMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>
      {notifications.length === 0 ? (
        <p className="p-4 text-sm text-gray-400 text-center">No notifications</p>
      ) : (
        <div className="divide-y">
          {notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={() => onMarkRead(notification.id)}
              onFeedback={(feedback) => onFeedback(notification.id, feedback)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
