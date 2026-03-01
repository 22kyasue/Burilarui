"""
Authentication Middleware
JWT token validation and user context management.
"""

from functools import wraps
from flask import request, jsonify, g
from backend.utils.auth import decode_token
from backend.storage import user_storage


def get_current_user():
    """
    Get the current authenticated user from request context.
    Returns None if not authenticated.
    """
    return getattr(g, 'current_user', None)


def auth_required(f):
    """
    Decorator to require authentication.
    Validates JWT token and sets g.current_user.
    Returns 401 if token is invalid or missing.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')

        if not auth_header.startswith('Bearer '):
            return jsonify({
                'error': {
                    'code': 'UNAUTHORIZED',
                    'message': '認証が必要です'
                }
            }), 401

        token = auth_header.replace('Bearer ', '')

        if not token:
            return jsonify({
                'error': {
                    'code': 'UNAUTHORIZED',
                    'message': '認証が必要です'
                }
            }), 401

        # Decode and validate token
        payload = decode_token(token)

        if not payload:
            return jsonify({
                'error': {
                    'code': 'INVALID_TOKEN',
                    'message': 'トークンが無効または期限切れです'
                }
            }), 401

        # Get user from storage
        user = user_storage.get(payload['user_id'])

        if not user:
            return jsonify({
                'error': {
                    'code': 'USER_NOT_FOUND',
                    'message': 'ユーザーが見つかりません'
                }
            }), 401

        # Set current user in request context
        g.current_user = {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'plan': user.get('plan', 'free'),
            'avatar': user.get('avatar'),
        }

        return f(*args, **kwargs)

    return decorated_function


def auth_optional(f):
    """
    Decorator for optional authentication.
    Sets g.current_user if valid token provided, but doesn't require it.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        g.current_user = None

        # Try to get token from Authorization header
        auth_header = request.headers.get('Authorization', '')

        if auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '')

            if token:
                payload = decode_token(token)

                if payload:
                    user = user_storage.get(payload['user_id'])

                    if user:
                        g.current_user = {
                            'id': user['id'],
                            'email': user['email'],
                            'name': user['name'],
                            'plan': user.get('plan', 'free'),
                            'avatar': user.get('avatar'),
                        }

        return f(*args, **kwargs)

    return decorated_function
