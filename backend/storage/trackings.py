"""
Tracking Storage
Handles tracking data persistence using JSON file storage.
"""

from .base import JSONFileStorage
from typing import List, Dict, Optional
from datetime import datetime
import os
import time

# Storage file path
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
TRACKINGS_FILE = os.path.join(DATA_DIR, 'trackings.json')


class TrackingStorage(JSONFileStorage):
    """Tracking-specific storage with user filtering and update management."""

    def __init__(self):
        super().__init__(TRACKINGS_FILE, id_field='id')

    def get_by_user(self, user_id: str) -> List[Dict]:
        """Get all trackings for a specific user, sorted by updated_at desc."""
        trackings = self.query({'user_id': user_id})
        trackings.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
        return trackings

    def get_user_tracking(self, user_id: str, tracking_id: str) -> Optional[Dict]:
        """Get a specific tracking only if it belongs to the user."""
        tracking = self.get(tracking_id)
        if tracking and tracking.get('user_id') == user_id:
            return tracking
        return None

    def get_active_trackings(self) -> List[Dict]:
        """Get all active trackings across all users (for background checker)."""
        return self.query({'is_active': True})

    def create_tracking(self, user_id: str, data: Dict) -> Dict:
        """Create a new tracking for a user."""
        tracking_data = {
            'user_id': user_id,
            'title': data.get('title', ''),
            'query': data.get('query', ''),
            'description': data.get('description', ''),
            'is_active': data.get('is_active', True),
            'is_pinned': data.get('is_pinned', False),
            'frequency': data.get('frequency', 'daily'),
            'custom_frequency_hours': data.get('custom_frequency_hours'),
            'notification_enabled': data.get('notification_enabled', True),
            'status': data.get('status', 'tracking'),
            'strategy': data.get('strategy', {}),
            'keywords': data.get('keywords', []),
            'last_search_result': data.get('last_search_result', {}),
            'last_executed_at': data.get('last_executed_at'),
            'next_execute_at': data.get('next_execute_at'),
            'image_url': data.get('image_url', ''),
            'update_count': 0,
            'unread_count': 0,
            'updates': [],
        }
        return self.create(tracking_data)

    def update_tracking(self, user_id: str, tracking_id: str, data: Dict) -> Optional[Dict]:
        """Update a tracking only if it belongs to the user."""
        tracking = self.get(tracking_id)
        if not tracking or tracking.get('user_id') != user_id:
            return None

        # Don't allow changing user_id
        data.pop('user_id', None)

        return self.update(tracking_id, data)

    def delete_tracking(self, user_id: str, tracking_id: str) -> bool:
        """Delete a tracking only if it belongs to the user."""
        tracking = self.get(tracking_id)
        if not tracking or tracking.get('user_id') != user_id:
            return False
        return self.delete(tracking_id)

    def add_update(self, user_id: str, tracking_id: str, update_data: Dict) -> Optional[Dict]:
        """Add an update entry to a tracking's updates list."""
        tracking = self.get_user_tracking(user_id, tracking_id)
        if not tracking:
            return None

        # Generate update ID if not provided
        if 'id' not in update_data:
            update_data['id'] = str(int(time.time() * 1000))
        if 'timestamp' not in update_data:
            update_data['timestamp'] = datetime.now().isoformat()
        if 'is_read' not in update_data:
            update_data['is_read'] = False

        updates = tracking.get('updates', [])
        updates.insert(0, update_data)  # Newest first

        update_count = tracking.get('update_count', 0) + 1
        unread_count = tracking.get('unread_count', 0) + 1

        return self.update(tracking_id, {
            'updates': updates,
            'update_count': update_count,
            'unread_count': unread_count,
        })

    def mark_updates_read(self, user_id: str, tracking_id: str, update_ids: List[str]) -> int:
        """Mark specific updates as read. Returns count of updates marked."""
        tracking = self.get_user_tracking(user_id, tracking_id)
        if not tracking:
            return 0

        updates = tracking.get('updates', [])
        marked = 0
        for update in updates:
            if update.get('id') in update_ids and not update.get('is_read'):
                update['is_read'] = True
                marked += 1

        if marked > 0:
            unread_count = max(0, tracking.get('unread_count', 0) - marked)
            self.update(tracking_id, {
                'updates': updates,
                'unread_count': unread_count,
            })

        return marked

    def mark_all_updates_read(self, user_id: str, tracking_id: str) -> int:
        """Mark all updates as read. Returns count of updates marked."""
        tracking = self.get_user_tracking(user_id, tracking_id)
        if not tracking:
            return 0

        updates = tracking.get('updates', [])
        marked = 0
        for update in updates:
            if not update.get('is_read'):
                update['is_read'] = True
                marked += 1

        if marked > 0:
            self.update(tracking_id, {
                'updates': updates,
                'unread_count': 0,
            })

        return marked


# Singleton instance
tracking_storage = TrackingStorage()
