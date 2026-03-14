"""
Auth API Tests
Tests registration, login, token refresh, and session management.
"""

import pytest


class TestRegister:
    def test_register_success(self, client):
        import time
        email = f'new{int(time.time()*1000)}@example.com'
        resp = client.post('/api/auth/register', json={
            'email': email,
            'password': 'password123',
            'name': 'New User',
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['user']['email'] == email
        assert data['user']['name'] == 'New User'
        assert 'accessToken' in data
        assert 'refreshToken' in data
        assert data['refreshToken'] != ''

    def test_register_duplicate_email(self, client):
        import time
        email = f'dup{int(time.time()*1000)}@example.com'
        client.post('/api/auth/register', json={
            'email': email,
            'password': 'password123',
            'name': 'First',
        })
        resp = client.post('/api/auth/register', json={
            'email': email,
            'password': 'password456',
            'name': 'Second',
        })
        assert resp.status_code == 409
        assert resp.get_json()['error']['code'] == 'EMAIL_EXISTS'

    def test_register_missing_fields(self, client):
        resp = client.post('/api/auth/register', json={
            'email': 'x@example.com',
        })
        assert resp.status_code == 400
        assert resp.get_json()['error']['code'] == 'VALIDATION_ERROR'

    def test_register_invalid_email(self, client):
        resp = client.post('/api/auth/register', json={
            'email': 'not-an-email',
            'password': 'password123',
            'name': 'Bad Email',
        })
        assert resp.status_code == 400

    def test_register_short_password(self, client):
        resp = client.post('/api/auth/register', json={
            'email': 'short@example.com',
            'password': '123',
            'name': 'Short Pass',
        })
        assert resp.status_code == 400


class TestLogin:
    def test_login_success(self, client):
        import time
        email = f'login{int(time.time()*1000)}@example.com'
        client.post('/api/auth/register', json={
            'email': email,
            'password': 'password123',
            'name': 'Login User',
        })

        resp = client.post('/api/auth/login', json={
            'email': email,
            'password': 'password123',
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['user']['email'] == email
        assert 'accessToken' in data
        assert 'refreshToken' in data

    def test_login_wrong_password(self, client):
        import time
        email = f'wrong{int(time.time()*1000)}@example.com'
        client.post('/api/auth/register', json={
            'email': email,
            'password': 'rightpass',
            'name': 'Wrong Pass',
        })
        resp = client.post('/api/auth/login', json={
            'email': email,
            'password': 'wrongpass',
        })
        assert resp.status_code == 401
        assert resp.get_json()['error']['code'] == 'INVALID_CREDENTIALS'

    def test_login_nonexistent_email(self, client):
        resp = client.post('/api/auth/login', json={
            'email': 'nobody@example.com',
            'password': 'password123',
        })
        assert resp.status_code == 401

    def test_login_missing_fields(self, client):
        resp = client.post('/api/auth/login', json={})
        assert resp.status_code == 400


class TestMe:
    def test_me_authenticated(self, client, auth_headers):
        resp = client.get('/api/auth/me', headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'email' in data
        assert 'name' in data

    def test_me_no_token(self, client):
        resp = client.get('/api/auth/me')
        assert resp.status_code == 401

    def test_me_invalid_token(self, client):
        resp = client.get('/api/auth/me', headers={
            'Authorization': 'Bearer invalid-token'
        })
        assert resp.status_code == 401


class TestRefresh:
    def test_refresh_token(self, client):
        import time
        reg = client.post('/api/auth/register', json={
            'email': f'refresh{int(time.time()*1000)}@example.com',
            'password': 'password123',
            'name': 'Refresh User',
        })
        refresh_token = reg.get_json()['refreshToken']

        resp = client.post('/api/auth/refresh', json={
            'refreshToken': refresh_token,
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'accessToken' in data
        assert 'refreshToken' in data
        # Old refresh token should be invalidated (rotation)
        assert data['refreshToken'] != refresh_token

    def test_refresh_invalid_token(self, client):
        resp = client.post('/api/auth/refresh', json={
            'refreshToken': 'invalid-refresh-token',
        })
        assert resp.status_code == 401

    def test_refresh_missing_token(self, client):
        resp = client.post('/api/auth/refresh', json={})
        assert resp.status_code == 400


class TestLogout:
    def test_logout(self, client):
        import time
        reg = client.post('/api/auth/register', json={
            'email': f'logout{int(time.time()*1000)}@example.com',
            'password': 'password123',
            'name': 'Logout User',
        })
        refresh_token = reg.get_json()['refreshToken']

        resp = client.post('/api/auth/logout', json={
            'refreshToken': refresh_token,
        })
        assert resp.status_code == 200

        # Refresh should fail after logout
        resp = client.post('/api/auth/refresh', json={
            'refreshToken': refresh_token,
        })
        assert resp.status_code == 401
