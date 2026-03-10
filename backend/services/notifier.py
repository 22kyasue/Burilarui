"""
Notification Service
Thin service layer for creating notifications via NotificationStorage.
Replaces the old NotificationManager that had its own JSON file I/O.
"""

from typing import Dict, Optional
from backend.storage import notification_storage


class NotificationService:
    """Creates notifications and retrieves feedback summaries."""

    def notify_update(self, user_id: str, tracking_id: str,
                      title: str, message: str, details: Optional[Dict] = None) -> Dict:
        """Create an 'update' notification for a tracking change."""
        return notification_storage.create_notification(user_id, {
            'type': 'update',
            'title': title,
            'message': message,
            'tracking_id': tracking_id,
            'details': details,
        })

    def notify_system(self, user_id: str, title: str, message: str) -> Dict:
        """Create a system notification (not tied to a tracking)."""
        return notification_storage.create_notification(user_id, {
            'type': 'system',
            'title': title,
            'message': message,
        })

    def get_feedback_summary(self, tracking_id: str) -> Dict:
        """Get aggregated feedback for a tracking's notifications."""
        return notification_storage.get_feedback_summary(tracking_id)
