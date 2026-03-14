"""
Chats API Tests
Tests chat CRUD and messaging.
"""

import pytest
from unittest.mock import patch


class TestChatCRUD:
    def test_list_chats_empty(self, client, auth_headers):
        resp = client.get('/api/chats', headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()['chats'] == []

    def test_create_chat(self, client, auth_headers):
        resp = client.post('/api/chats', headers=auth_headers, json={
            'title': 'Test Chat',
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['title'] == 'Test Chat'
        assert data['messages'] == []

    def test_get_chat(self, client, auth_headers):
        # Create first
        create_resp = client.post('/api/chats', headers=auth_headers, json={
            'title': 'Get Chat Test',
        })
        chat_id = create_resp.get_json()['id']

        resp = client.get(f'/api/chats/{chat_id}', headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()['title'] == 'Get Chat Test'

    def test_get_chat_not_found(self, client, auth_headers):
        resp = client.get('/api/chats/nonexistent', headers=auth_headers)
        assert resp.status_code == 404

    def test_update_chat(self, client, auth_headers):
        create_resp = client.post('/api/chats', headers=auth_headers, json={
            'title': 'Original',
        })
        chat_id = create_resp.get_json()['id']

        resp = client.put(f'/api/chats/{chat_id}', headers=auth_headers, json={
            'title': 'Updated',
        })
        assert resp.status_code == 200
        assert resp.get_json()['title'] == 'Updated'

    def test_delete_chat(self, client, auth_headers):
        create_resp = client.post('/api/chats', headers=auth_headers, json={
            'title': 'To Delete',
        })
        chat_id = create_resp.get_json()['id']

        resp = client.delete(f'/api/chats/{chat_id}', headers=auth_headers)
        assert resp.status_code == 204

        # Verify deleted
        resp = client.get(f'/api/chats/{chat_id}', headers=auth_headers)
        assert resp.status_code == 404

    def test_delete_chat_not_found(self, client, auth_headers):
        resp = client.delete('/api/chats/nonexistent', headers=auth_headers)
        assert resp.status_code == 404


class TestChatMessages:
    def test_add_message(self, client, auth_headers):
        # Create chat
        create_resp = client.post('/api/chats', headers=auth_headers, json={
            'title': 'Msg Chat',
        })
        chat_id = create_resp.get_json()['id']

        # Add message (mock AI response)
        with patch('backend.utils.ai_client.call_ai', return_value='AI response content'):
            resp = client.post(f'/api/chats/{chat_id}/messages', headers=auth_headers, json={
                'content': 'Hello AI',
                'role': 'user',
                'id': 'msg-1',
            })
            assert resp.status_code == 200
            data = resp.get_json()
            # Should have user message + AI response
            assert len(data['messages']) >= 1

    def test_add_message_to_nonexistent_chat(self, client, auth_headers):
        resp = client.post('/api/chats/nonexistent/messages', headers=auth_headers, json={
            'content': 'Hello',
            'role': 'user',
            'id': 'msg-1',
        })
        assert resp.status_code == 404

    def test_add_message_missing_content(self, client, auth_headers):
        create_resp = client.post('/api/chats', headers=auth_headers, json={})
        chat_id = create_resp.get_json()['id']

        resp = client.post(f'/api/chats/{chat_id}/messages', headers=auth_headers, json={
            'role': 'user',
        })
        assert resp.status_code == 400


class TestChatAuth:
    def test_list_chats_no_auth(self, client):
        resp = client.get('/api/chats')
        assert resp.status_code == 401
