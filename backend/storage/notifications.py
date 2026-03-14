"""
Notification Storage
Handles notification data persistence. Backend-agnostic (JSON or SQLite).
"""

from typing import List, Dict, Optional
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
NOTIFICATIONS_FILE = os.path.join(DATA_DIR, 'notifications.json')


class NotificationStorage:
    """Notification-specific storage with user filtering and read/feedback management."""

    def __init__(self):
        use_sqlite = os.getenv('STORAGE_BACKEND', '').lower() == 'sqlite'
        if use_sqlite:
            from .sqlite_storage import SQLiteStorage
            self._backend = SQLiteStorage('notifications', id_field='id')
        else:
            from .base import JSONFileStorage
            self._backend = JSONFileStorage(NOTIFICATIONS_FILE, id_field='id')

    # --- Delegate base methods ---

    def get(self, key: str) -> Optional[Dict]:
        return self._backend.get(key)

    def get_all(self) -> List[Dict]:
        return self._backend.get_all()

    def query(self, filters: Dict) -> List[Dict]:
        return self._backend.query(filters)

    def create(self, data: Dict) -> Dict:
        return self._backend.create(data)

    def update(self, key: str, data: Dict) -> Optional[Dict]:
        return self._backend.update(key, data)

    def delete(self, key: str) -> bool:
        return self._backend.delete(key)

    def count(self, filters: Dict = None) -> int:
        return self._backend.count(filters)

    def bulk_update(self, keys: List[str], data: Dict) -> int:
        return self._backend.bulk_update(keys, data)

    # --- Domain methods ---

    def get_by_user(self, user_id: str, unread_only: bool = False,
                    limit: int = 50, offset: int = 0) -> List[Dict]:
        """Get notifications for a user, sorted by created_at desc."""
        filters = {'user_id': user_id}
        if unread_only:
            filters['read'] = False

        notifications = self.query(filters)
        notifications.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return notifications[offset:offset + limit]

    def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user."""
        return self.count({'user_id': user_id, 'read': False})

    def create_notification(self, user_id: str, data: Dict) -> Dict:
        """Create a new notification for a user."""
        notification_data = {
            'user_id': user_id,
            'type': data.get('type', 'info'),
            'title': data.get('title', ''),
            'message': data.get('message', ''),
            'tracking_id': data.get('tracking_id'),
            'read': False,
            'feedback': None,
            'details': data.get('details'),
        }
        return self.create(notification_data)

    def mark_read(self, user_id: str, notification_id: str) -> bool:
        """Mark a single notification as read."""
        notification = self.get(notification_id)
        if not notification or notification.get('user_id') != user_id:
            return False
        self.update(notification_id, {'read': True})
        return True

    def mark_all_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user."""
        unread = self.query({'user_id': user_id, 'read': False})
        ids = [n['id'] for n in unread]
        if not ids:
            return 0
        return self.bulk_update(ids, {'read': True})

    def delete_notification(self, user_id: str, notification_id: str) -> bool:
        """Delete a notification only if it belongs to the user."""
        notification = self.get(notification_id)
        if not notification or notification.get('user_id') != user_id:
            return False
        return self.delete(notification_id)

    def submit_feedback(self, user_id: str, notification_id: str, feedback: str) -> bool:
        """Submit feedback (useful/not_useful) for a notification."""
        notification = self.get(notification_id)
        if not notification or notification.get('user_id') != user_id:
            return False
        self.update(notification_id, {'feedback': feedback})
        return True

    def get_feedback_summary(self, tracking_id: str) -> Dict:
        """Aggregate feedback for notifications related to a specific tracking."""
        notifications = self.query({'tracking_id': tracking_id})
        summary = {'useful': [], 'not_useful': []}

        for n in notifications:
            feedback = n.get('feedback')
            if feedback in summary:
                summary[feedback].append({
                    'id': n['id'],
                    'message': n.get('message', ''),
                    'timestamp': n.get('created_at', ''),
                    'details': n.get('details', {}),
                })

        return summary


# Singleton instance
notification_storage = NotificationStorage()
