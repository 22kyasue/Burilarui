"""
Search API Tests
Tests the one-shot search endpoint.
"""

import pytest
from unittest.mock import patch, MagicMock


class TestSearch:
    def test_search_missing_query(self, client, auth_headers):
        resp = client.post('/api/search', headers=auth_headers, json={})
        assert resp.status_code == 400

    def test_search_empty_query(self, client, auth_headers):
        resp = client.post('/api/search', headers=auth_headers, json={
            'query': '   ',
        })
        assert resp.status_code == 400

    def test_search_success(self, client, auth_headers):
        with patch('backend.core.tracker.BurilarTracker.process_query') as mock_process, \
             patch('backend.core.tracker.BurilarTracker.search') as mock_search:

            mock_process.return_value = {
                'resolved_query': 'test query',
                'needs_clarification': False,
                'status': 'ready',
            }
            mock_search.return_value = {
                'content': 'Search result content',
                'status': 'completed',
                'explanation': 'Topic is resolved',
                'images': [],
            }

            resp = client.post('/api/search', headers=auth_headers, json={
                'query': 'test query',
            })
            assert resp.status_code == 200
            data = resp.get_json()
            assert data['needsClarification'] is False
            assert 'content' in data

    def test_search_needs_clarification(self, client, auth_headers):
        with patch('backend.core.tracker.BurilarTracker.process_query') as mock_process:
            mock_process.return_value = {
                'resolved_query': 'ambiguous query',
                'needs_clarification': True,
                'reason': 'Ambiguous',
                'questions': ['Did you mean A or B?'],
                'status': 'ambiguous',
            }

            resp = client.post('/api/search', headers=auth_headers, json={
                'query': 'ambiguous query',
            })
            assert resp.status_code == 200
            data = resp.get_json()
            assert data['needsClarification'] is True
            assert len(data['questions']) > 0

    def test_search_query_too_long(self, client, auth_headers):
        resp = client.post('/api/search', headers=auth_headers, json={
            'query': 'x' * 1001,
        })
        assert resp.status_code == 400


class TestSearchAuth:
    def test_search_no_auth(self, client):
        resp = client.post('/api/search', json={'query': 'test'})
        assert resp.status_code == 401
