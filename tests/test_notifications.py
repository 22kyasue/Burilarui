"""
Notifications API Tests
Tests notification CRUD, read marking, and feedback.
"""

import pytest
from backend.storage import notification_storage


class TestNotificationList:
    def test_list_notifications_empty(self, client, auth_headers):
        resp = client.get('/api/notifications', headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'notifications' in data
        assert 'unreadCount' in data

    def test_unread_count(self, client, auth_headers):
        resp = client.get('/api/notifications/unread-count', headers=auth_headers)
        assert resp.status_code == 200
        assert 'count' in resp.get_json()


class TestNotificationActions:
    def _create_notification(self, user_id):
        """Helper to create a test notification."""
        return notification_storage.create_notification(user_id, {
            'type': 'update',
            'title': 'Test Notification',
            'message': 'Test message content',
            'tracking_id': 'tracking-1',
        })

    def test_mark_read(self, client, auth_user):
        headers, user = auth_user
        notif = self._create_notification(user['id'])

        resp = client.patch(f'/api/notifications/{notif["id"]}/read', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['success'] is True

    def test_mark_read_not_found(self, client, auth_headers):
        resp = client.patch('/api/notifications/nonexistent/read', headers=auth_headers)
        assert resp.status_code == 404

    def test_mark_all_read(self, client, auth_user):
        headers, user = auth_user
        self._create_notification(user['id'])
        self._create_notification(user['id'])

        resp = client.post('/api/notifications/mark-all-read', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['success'] is True

    def test_delete_notification(self, client, auth_user):
        headers, user = auth_user
        notif = self._create_notification(user['id'])

        resp = client.delete(f'/api/notifications/{notif["id"]}', headers=headers)
        assert resp.status_code == 204

    def test_delete_notification_not_found(self, client, auth_headers):
        resp = client.delete('/api/notifications/nonexistent', headers=auth_headers)
        assert resp.status_code == 404


class TestNotificationFeedback:
    def _create_notification(self, user_id):
        return notification_storage.create_notification(user_id, {
            'type': 'update',
            'title': 'Feedback Test',
            'message': 'Test feedback',
        })

    def test_submit_feedback_useful(self, client, auth_user):
        headers, user = auth_user
        notif = self._create_notification(user['id'])

        resp = client.post(f'/api/notifications/{notif["id"]}/feedback', headers=headers, json={
            'feedback': 'useful',
        })
        assert resp.status_code == 200

    def test_submit_feedback_not_useful(self, client, auth_user):
        headers, user = auth_user
        notif = self._create_notification(user['id'])

        resp = client.post(f'/api/notifications/{notif["id"]}/feedback', headers=headers, json={
            'feedback': 'not_useful',
        })
        assert resp.status_code == 200

    def test_submit_feedback_invalid(self, client, auth_user):
        headers, user = auth_user
        notif = self._create_notification(user['id'])

        resp = client.post(f'/api/notifications/{notif["id"]}/feedback', headers=headers, json={
            'feedback': 'invalid_value',
        })
        assert resp.status_code == 400

    def test_submit_feedback_missing(self, client, auth_user):
        headers, user = auth_user
        notif = self._create_notification(user['id'])

        resp = client.post(f'/api/notifications/{notif["id"]}/feedback', headers=headers, json={})
        assert resp.status_code == 400


class TestNotificationAuth:
    def test_list_no_auth(self, client):
        resp = client.get('/api/notifications')
        assert resp.status_code == 401
