"""
Trackings API Tests
Tests CRUD operations and tracking execution.
"""

import pytest
from unittest.mock import patch, MagicMock


class TestTrackingCRUD:
    def test_list_trackings_empty(self, client, auth_headers):
        resp = client.get('/api/trackings', headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()['trackings'] == []

    def test_create_tracking(self, client, auth_headers):
        with patch('backend.core.tracker.BurilarTracker.create_tracking') as mock:
            mock.return_value = {
                'id': 'test-tracking-1',
                'user_id': 'test-user',
                'title': 'Test Query',
                'query': 'Test Query',
                'is_active': True,
                'frequency': 'daily',
                'status': 'tracking',
                'updates': [],
                'created_at': '2026-01-01T00:00:00',
                'updated_at': '2026-01-01T00:00:00',
            }
            resp = client.post('/api/trackings', headers=auth_headers, json={
                'query': 'Test Query',
            })
            assert resp.status_code == 201
            data = resp.get_json()
            assert 'tracking' in data
            assert data['tracking']['query'] == 'Test Query'

    def test_create_tracking_missing_query(self, client, auth_headers):
        resp = client.post('/api/trackings', headers=auth_headers, json={})
        assert resp.status_code == 400

    def test_create_tracking_empty_query(self, client, auth_headers):
        resp = client.post('/api/trackings', headers=auth_headers, json={
            'query': '   ',
        })
        assert resp.status_code == 400

    def test_create_tracking_invalid_frequency(self, client, auth_headers):
        resp = client.post('/api/trackings', headers=auth_headers, json={
            'query': 'Test',
            'frequency': 'invalid_freq',
        })
        assert resp.status_code == 400

    def test_get_tracking_not_found(self, client, auth_headers):
        resp = client.get('/api/trackings/nonexistent', headers=auth_headers)
        assert resp.status_code == 404

    def test_delete_tracking_not_found(self, client, auth_headers):
        resp = client.delete('/api/trackings/nonexistent', headers=auth_headers)
        assert resp.status_code == 404

    def test_update_tracking_not_found(self, client, auth_headers):
        resp = client.patch('/api/trackings/nonexistent', headers=auth_headers, json={
            'isActive': False,
        })
        assert resp.status_code == 404


class TestTrackingAuth:
    def test_list_trackings_no_auth(self, client):
        resp = client.get('/api/trackings')
        assert resp.status_code == 401

    def test_create_tracking_no_auth(self, client):
        resp = client.post('/api/trackings', json={'query': 'Test'})
        assert resp.status_code == 401


class TestTrackingUpdates:
    def test_get_updates_not_found(self, client, auth_headers):
        resp = client.get('/api/trackings/nonexistent/updates', headers=auth_headers)
        assert resp.status_code == 404

    def test_mark_updates_read_missing_ids(self, client, auth_headers):
        resp = client.post('/api/trackings/any/updates/read', headers=auth_headers, json={})
        assert resp.status_code == 400
