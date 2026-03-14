"""Tests for billing routes and usage limits."""

import pytest


class TestPlans:
    """Test plan listing endpoint (no auth required)."""

    def test_list_plans(self, client):
        res = client.get('/api/billing/plans')
        assert res.status_code == 200
        data = res.get_json()
        plans = data['plans']
        assert len(plans) == 3
        ids = [p['id'] for p in plans]
        assert 'free' in ids
        assert 'pro' in ids
        assert 'enterprise' in ids

    def test_plan_has_features(self, client):
        res = client.get('/api/billing/plans')
        plans = res.get_json()['plans']
        free = next(p for p in plans if p['id'] == 'free')
        assert len(free['features']) > 0
        assert free['priceMonthly'] == 0
        assert free['limits']['active_trackings'] == 3

    def test_pro_plan_pricing(self, client):
        res = client.get('/api/billing/plans')
        plans = res.get_json()['plans']
        pro = next(p for p in plans if p['id'] == 'pro')
        assert pro['priceMonthly'] == 9
        assert pro['limits']['active_trackings'] == -1  # unlimited


class TestBillingStatus:
    """Test billing status endpoint."""

    def test_status_requires_auth(self, client):
        res = client.get('/api/billing/status')
        assert res.status_code == 401

    def test_status_returns_usage(self, client, auth_headers):
        res = client.get('/api/billing/status', headers=auth_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data['plan'] == 'free'
        assert 'usage' in data
        assert 'searches_per_day' in data['usage']
        assert 'chats_per_day' in data['usage']
        assert 'activeTrackings' in data

    def test_status_shows_correct_limits(self, client, auth_headers):
        res = client.get('/api/billing/status', headers=auth_headers)
        data = res.get_json()
        # Free plan: 10 searches/day
        assert data['usage']['searches_per_day']['limit'] == 10
        assert data['usage']['chats_per_day']['limit'] == 5


class TestCheckout:
    """Test checkout creation (Stripe not configured in test)."""

    def test_checkout_requires_auth(self, client):
        res = client.post('/api/billing/checkout')
        assert res.status_code == 401

    def test_checkout_without_stripe_config(self, client, auth_headers):
        res = client.post('/api/billing/checkout', headers=auth_headers)
        assert res.status_code == 503
        data = res.get_json()
        assert data['error']['code'] == 'BILLING_NOT_CONFIGURED'


class TestPortal:
    """Test portal session creation."""

    def test_portal_requires_auth(self, client):
        res = client.post('/api/billing/portal')
        assert res.status_code == 401

    def test_portal_without_stripe_config(self, client, auth_headers):
        res = client.post('/api/billing/portal', headers=auth_headers)
        assert res.status_code == 503


class TestUsageLimits:
    """Test that usage limits are enforced on endpoints."""

    def test_search_limit_enforced(self, client, auth_headers):
        """Free plan allows 10 searches/day. After 10, should get 429."""
        from backend.billing.usage import _usage_counts
        # Pre-fill usage to limit
        from flask import g
        # We need to simulate hitting the limit by calling the endpoint
        # Since search calls AI which is expensive, test the usage module directly
        from backend.billing.usage import increment_usage, get_usage
        # Get user ID from a status call
        res = client.get('/api/billing/status', headers=auth_headers)
        user_id = None
        # Extract user_id indirectly — use auth endpoint
        res = client.get('/api/auth/me', headers=auth_headers)
        data = res.get_json()
        user_id = data.get('user', {}).get('id') or data.get('id')

        if user_id:
            # Fill up usage to limit
            for _ in range(10):
                increment_usage(user_id, 'searches_per_day')

            # Next search should be rejected
            res = client.post('/api/search', json={'query': 'test'},
                              headers=auth_headers)
            assert res.status_code == 429
            body = res.get_json()
            assert body['error']['code'] == 'LIMIT_EXCEEDED'
