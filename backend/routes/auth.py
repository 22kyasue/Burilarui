"""
Authentication Routes
Handles user registration, login, token refresh, and session management.
"""

from flask import Blueprint, request, jsonify, g
from backend.storage import user_storage
from backend.utils.auth import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, validate_refresh_token, rotate_refresh_token,
    revoke_refresh_token,
)
from backend.extensions import limiter
from backend.middleware.auth import auth_required, get_current_user
from backend.validation.schemas import validate_request, REGISTER_SCHEMA, LOGIN_SCHEMA

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _issue_tokens(user):
    """Issue access + refresh tokens for a user."""
    token_data = create_access_token(user['id'], user['email'])
    refresh = create_refresh_token(user['id'], user['email'])
    return {
        'accessToken': token_data['access_token'],
        'refreshToken': refresh,
        'expiresAt': token_data['expires_at'],
    }


@auth_bp.route('/register', methods=['POST'])
@limiter.limit("3/minute")
@validate_request(REGISTER_SCHEMA)
def register():
    """Register a new user."""
    email = request.validated['email']
    password = request.validated['password']
    name = request.validated['name']

    # Check if email already exists
    if user_storage.get_by_email(email):
        return jsonify({
            'error': {
                'code': 'EMAIL_EXISTS',
                'message': 'このメールアドレスは既に登録されています'
            }
        }), 409

    # Create user
    try:
        user = user_storage.create({
            'email': email,
            'password_hash': hash_password(password),
            'name': name,
            'plan': 'free',
        })
    except ValueError as e:
        return jsonify({
            'error': {
                'code': 'EMAIL_EXISTS',
                'message': str(e)
            }
        }), 409

    tokens = _issue_tokens(user)

    return jsonify({
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'plan': user.get('plan', 'free'),
        },
        **tokens,
    }), 201


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5/minute")
@validate_request(LOGIN_SCHEMA)
def login():
    """Login with email and password."""
    email = request.validated['email']
    password = request.validated['password']

    # Find user
    user = user_storage.get_by_email(email)
    if not user:
        return jsonify({
            'error': {
                'code': 'INVALID_CREDENTIALS',
                'message': 'メールアドレスまたはパスワードが正しくありません'
            }
        }), 401

    # Verify password
    if not verify_password(password, user.get('password_hash', '')):
        return jsonify({
            'error': {
                'code': 'INVALID_CREDENTIALS',
                'message': 'メールアドレスまたはパスワードが正しくありません'
            }
        }), 401

    tokens = _issue_tokens(user)

    return jsonify({
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'plan': user.get('plan', 'free'),
        },
        **tokens,
    })


@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """Refresh access token using a valid refresh token."""
    data = request.json or {}
    refresh_token = data.get('refreshToken', '')

    if not refresh_token:
        return jsonify({
            'error': {'code': 'VALIDATION_ERROR', 'message': 'refreshToken is required'}
        }), 400

    user_info = validate_refresh_token(refresh_token)
    if not user_info:
        return jsonify({
            'error': {'code': 'INVALID_TOKEN', 'message': 'リフレッシュトークンが無効または期限切れです'}
        }), 401

    # Verify user still exists
    user = user_storage.get(user_info['user_id'])
    if not user:
        revoke_refresh_token(refresh_token)
        return jsonify({
            'error': {'code': 'USER_NOT_FOUND', 'message': 'ユーザーが見つかりません'}
        }), 401

    # Rotate: invalidate old, issue new
    new_access = create_access_token(user['id'], user['email'])
    new_refresh = rotate_refresh_token(refresh_token, user['id'], user['email'])

    return jsonify({
        'accessToken': new_access['access_token'],
        'refreshToken': new_refresh,
        'expiresAt': new_access['expires_at'],
    })


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout — revoke the refresh token."""
    data = request.json or {}
    refresh_token = data.get('refreshToken', '')

    if refresh_token:
        revoke_refresh_token(refresh_token)

    return jsonify({'success': True})


@auth_bp.route('/me', methods=['GET'])
@auth_required
def get_me():
    """Get current authenticated user."""
    user = get_current_user()

    if not user or user.get('id') == 'dev-user-001':
        return jsonify({
            'error': {
                'code': 'UNAUTHORIZED',
                'message': '認証が必要です'
            }
        }), 401

    return jsonify({
        'id': user['id'],
        'email': user['email'],
        'name': user['name'],
        'plan': user.get('plan', 'free'),
    })


@auth_bp.route('/me', methods=['PATCH'])
@auth_required
def update_me():
    """Update current authenticated user's profile (name only)."""
    user = get_current_user()

    if not user or user.get('id') == 'dev-user-001':
        return jsonify({
            'error': {
                'code': 'UNAUTHORIZED',
                'message': '認証が必要です'
            }
        }), 401

    data = request.json or {}
    name = data.get('name', '').strip()

    if not name:
        return jsonify({
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': '名前は必須です'
            }
        }), 400

    updated = user_storage.update(user['id'], {'name': name})

    return jsonify({
        'id': updated['id'],
        'email': updated['email'],
        'name': updated['name'],
        'plan': updated.get('plan', 'free'),
    })


@auth_bp.route('/google', methods=['POST'])
def google_login():
    """Login with Google OAuth."""
    data = request.json or {}
    token = data.get('token')

    if not token:
        return jsonify({
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'トークンが必要です'
            }
        }), 400

    # MOCK: In production, verify token with Google OAuth2
    email = "google_user@example.com"
    name = "Google User"

    user = user_storage.get_by_email(email)

    if not user:
        try:
            user = user_storage.create({
                'email': email,
                'password_hash': 'google_oauth_placeholder',
                'name': name,
                'plan': 'free',
                'auth_provider': 'google'
            })
        except ValueError:
            user = user_storage.get_by_email(email)

    tokens = _issue_tokens(user)

    return jsonify({
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'avatar': user.get('avatar'),
            'plan': user.get('plan', 'free'),
        },
        **tokens,
    })
