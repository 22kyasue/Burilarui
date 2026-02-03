"""
Tests for Notifications API
Run with: python -m pytest backend/tests/test_notifications.py -v
"""

import os
import sys
import json
import pytest
import tempfile
import shutil

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from burilar_api import app
from backend.storage import JSONFileStorage


@pytest.fixture
def client():
    """Create test client with temporary data directory."""
    # Create temp directory for test data
    temp_dir = tempfile.mkdtemp()

    # Override the storage path
    import backend.routes.notifications as notifications_module
    original_storage = notifications_module.notifications_storage
    notifications_module.notifications_storage = JSONFileStorage(
        os.path.join(temp_dir, 'notifications.json')
    )

    app.config['TESTING'] = True

    with app.test_client() as client:
        yield client

    # Restore original storage and cleanup
    notifications_module.notifications_storage = original_storage
    shutil.rmtree(temp_dir)


@pytest.fixture
def sample_notifications(client):
    """Create sample notifications for testing."""
    import backend.routes.notifications as notifications_module
    storage = notifications_module.notifications_storage

    notifications = [
        {
            'id': 'notif-1',
            'user_id': 'dev-user-001',
            'type': 'tracking_update',
            'title': 'Update: Apple Intelligence',
            'message': 'New features announced for iOS 19',
            'timestamp': '2025-01-15T10:00:00',
            'is_read': False,
            'tracking_id': 'tracking-1',
        },
        {
            'id': 'notif-2',
            'user_id': 'dev-user-001',
            'type': 'tracking_update',
            'title': 'Update: React 20',
            'message': 'React 20 beta released',
            'timestamp': '2025-01-14T09:00:00',
            'is_read': False,
            'tracking_id': 'tracking-2',
        },
        {
            'id': 'notif-3',
            'user_id': 'dev-user-001',
            'type': 'system',
            'title': 'Welcome to Burilar',
            'message': 'Thanks for signing up!',
            'timestamp': '2025-01-01T00:00:00',
            'is_read': True,
        },
        {
            'id': 'notif-other-user',
            'user_id': 'other-user',
            'type': 'system',
            'title': 'Other user notification',
            'message': 'Should not be visible',
            'timestamp': '2025-01-15T11:00:00',
            'is_read': False,
        },
    ]

    for notif in notifications:
        storage.create(notif)

    return notifications


class TestGetNotifications:
    """Tests for GET /api/notifications"""

    def test_get_notifications_empty(self, client):
        """Should return empty list when no notifications."""
        response = client.get('/api/notifications')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['notifications'] == []
        assert data['unread_count'] == 0

    def test_get_notifications_with_data(self, client, sample_notifications):
        """Should return notifications for current user only."""
        response = client.get('/api/notifications')
        assert response.status_code == 200
        data = json.loads(response.data)

        # Should only get dev-user-001's notifications (3 total)
        assert len(data['notifications']) == 3
        assert data['unread_count'] == 2  # 2 unread

        # Should be sorted by timestamp (newest first)
        timestamps = [n['timestamp'] for n in data['notifications']]
        assert timestamps == sorted(timestamps, reverse=True)

    def test_get_notifications_unread_only(self, client, sample_notifications):
        """Should filter to unread only when requested."""
        response = client.get('/api/notifications?unread_only=true')
        assert response.status_code == 200
        data = json.loads(response.data)

        assert len(data['notifications']) == 2
        for notif in data['notifications']:
            assert notif['is_read'] is False

    def test_get_notifications_pagination(self, client, sample_notifications):
        """Should support limit and offset."""
        response = client.get('/api/notifications?limit=1&offset=1')
        assert response.status_code == 200
        data = json.loads(response.data)

        assert len(data['notifications']) == 1
        # Second newest notification
        assert data['notifications'][0]['id'] == 'notif-2'


class TestGetUnreadCount:
    """Tests for GET /api/notifications/unread-count"""

    def test_unread_count_empty(self, client):
        """Should return 0 when no notifications."""
        response = client.get('/api/notifications/unread-count')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['count'] == 0

    def test_unread_count_with_data(self, client, sample_notifications):
        """Should return correct unread count."""
        response = client.get('/api/notifications/unread-count')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['count'] == 2


class TestMarkNotificationRead:
    """Tests for PATCH /api/notifications/{id}/read"""

    def test_mark_single_read(self, client, sample_notifications):
        """Should mark notification as read."""
        response = client.patch('/api/notifications/notif-1/read')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True

        # Verify it's now read
        response = client.get('/api/notifications/unread-count')
        data = json.loads(response.data)
        assert data['count'] == 1

    def test_mark_nonexistent_read(self, client):
        """Should return 404 for nonexistent notification."""
        response = client.patch('/api/notifications/nonexistent/read')
        assert response.status_code == 404

    def test_mark_other_user_notification_read(self, client, sample_notifications):
        """Should return 404 for other user's notification."""
        response = client.patch('/api/notifications/notif-other-user/read')
        assert response.status_code == 404


class TestMarkMultipleRead:
    """Tests for POST /api/notifications/mark-read"""

    def test_mark_multiple_read(self, client, sample_notifications):
        """Should mark multiple notifications as read."""
        response = client.post(
            '/api/notifications/mark-read',
            json={'notification_ids': ['notif-1', 'notif-2']}
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert data['updated_count'] == 2

        # Verify all are now read
        response = client.get('/api/notifications/unread-count')
        data = json.loads(response.data)
        assert data['count'] == 0

    def test_mark_multiple_read_empty_list(self, client):
        """Should return error for empty list."""
        response = client.post(
            '/api/notifications/mark-read',
            json={'notification_ids': []}
        )
        assert response.status_code == 400

    def test_mark_multiple_read_ignores_invalid(self, client, sample_notifications):
        """Should ignore invalid IDs and other user's notifications."""
        response = client.post(
            '/api/notifications/mark-read',
            json={'notification_ids': ['notif-1', 'invalid-id', 'notif-other-user']}
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['updated_count'] == 1


class TestMarkAllRead:
    """Tests for POST /api/notifications/mark-all-read"""

    def test_mark_all_read(self, client, sample_notifications):
        """Should mark all notifications as read."""
        response = client.post('/api/notifications/mark-all-read')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert data['updated_count'] == 2

        # Verify all are now read
        response = client.get('/api/notifications/unread-count')
        data = json.loads(response.data)
        assert data['count'] == 0


class TestDeleteNotification:
    """Tests for DELETE /api/notifications/{id}"""

    def test_delete_notification(self, client, sample_notifications):
        """Should delete notification."""
        response = client.delete('/api/notifications/notif-1')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True

        # Verify it's gone
        response = client.get('/api/notifications')
        data = json.loads(response.data)
        ids = [n['id'] for n in data['notifications']]
        assert 'notif-1' not in ids

    def test_delete_nonexistent(self, client):
        """Should return 404 for nonexistent notification."""
        response = client.delete('/api/notifications/nonexistent')
        assert response.status_code == 404

    def test_delete_other_user_notification(self, client, sample_notifications):
        """Should return 404 for other user's notification."""
        response = client.delete('/api/notifications/notif-other-user')
        assert response.status_code == 404


class TestClearAllNotifications:
    """Tests for DELETE /api/notifications/all"""

    def test_clear_all(self, client, sample_notifications):
        """Should clear all notifications for current user."""
        response = client.delete('/api/notifications/all')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert data['deleted_count'] == 3

        # Verify all are gone
        response = client.get('/api/notifications')
        data = json.loads(response.data)
        assert len(data['notifications']) == 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
