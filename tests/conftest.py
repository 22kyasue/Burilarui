"""
Shared test fixtures for backend API tests.
"""

import os
import json
import pytest
import tempfile
import shutil

# Force JSON backend and dev mode for tests
os.environ['STORAGE_BACKEND'] = 'json'
os.environ['FLASK_DEBUG'] = '1'

import time as _time
# Counter for unique emails per test — use timestamp to avoid collisions across runs
_email_counter = int(_time.time() * 1000)


@pytest.fixture(autouse=True)
def reset_rate_limiter(app):
    """Disable rate limiting for tests."""
    from backend.extensions import limiter
    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.fixture
def app():
    """Create a Flask test app."""
    from burilar_api import app
    app.config['TESTING'] = True
    return app


@pytest.fixture
def client(app):
    """Create a Flask test client."""
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    """Register a unique test user and return auth headers."""
    global _email_counter
    _email_counter += 1
    email = f'test{_email_counter}@example.com'

    resp = client.post('/api/auth/register', json={
        'email': email,
        'password': 'testpass123',
        'name': 'Test User',
    })
    data = resp.get_json()
    token = data.get('accessToken', '')
    return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}


@pytest.fixture
def auth_user(client):
    """Register a unique test user and return (headers, user_data)."""
    global _email_counter
    _email_counter += 1
    email = f'testuser{_email_counter}@example.com'

    resp = client.post('/api/auth/register', json={
        'email': email,
        'password': 'testpass123',
        'name': 'Test User',
    })
    data = resp.get_json()
    token = data.get('accessToken', '')
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    return headers, data.get('user', {})
