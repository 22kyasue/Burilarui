"""
Authentication Routes
Handles user registration, login, and session management.
"""

from flask import Blueprint, request, jsonify, g
from backend.storage import user_storage
from backend.utils.auth import hash_password, verify_password, create_access_token
from backend.middleware.auth import auth_required, get_current_user
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def validate_email(email: str) -> bool:
    """Basic email validation."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password: str) -> tuple[bool, str]:
    """Validate password strength."""
    if len(password) < 6:
        return False, 'パスワードは6文字以上必要です'
    return True, ''


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.json or {}

    email = data.get('email', '').strip()
    password = data.get('password', '')
    name = data.get('name', '').strip()

    # Validation
    if not email or not password or not name:
        return jsonify({
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': '全ての項目を入力してください'
            }
        }), 400

    if not validate_email(email):
        return jsonify({
            'error': {
                'code': 'INVALID_EMAIL',
                'message': '有効なメールアドレスを入力してください'
            }
        }), 400

    valid_password, password_error = validate_password(password)
    if not valid_password:
        return jsonify({
            'error': {
                'code': 'INVALID_PASSWORD',
                'message': password_error
            }
        }), 400

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

    # Generate token
    token_data = create_access_token(user['id'], user['email'])

    return jsonify({
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'plan': user.get('plan', 'free'),
        },
        'accessToken': token_data['access_token'],
        'refreshToken': '',  # Not implemented for MVP
        'expiresAt': token_data['expires_at'],
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with email and password."""
    data = request.json or {}

    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    print(f"DEBUG: Login attempt for email: {email}")
    print(f"DEBUG: Request headers: {request.headers}")

    if not email or not password:
        return jsonify({
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'メールアドレスとパスワードを入力してください'
            }
        }), 400

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

    # Generate token
    token_data = create_access_token(user['id'], user['email'])

    return jsonify({
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'plan': user.get('plan', 'free'),
        },
        'accessToken': token_data['access_token'],
        'refreshToken': '',  # Not implemented for MVP
        'expiresAt': token_data['expires_at'],
    })


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
        'avatar': user.get('avatar'),
    })



@auth_bp.route('/google', methods=['POST'])
def google_login():
    """Login with Google OAuth — verifies access token via Google's userinfo endpoint."""
    import requests as req
    data = request.json or {}
    token = data.get('token')

    if not token:
        return jsonify({'error': {'code': 'VALIDATION_ERROR', 'message': 'トークンが必要です'}}), 400

    # Verify token and fetch user info from Google
    try:
        r = req.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {token}'},
            timeout=10,
        )
        if r.status_code != 200:
            return jsonify({'error': {'code': 'INVALID_TOKEN', 'message': 'Googleトークンが無効です'}}), 401
        info = r.json()
    except Exception:
        return jsonify({'error': {'code': 'GOOGLE_ERROR', 'message': 'Google認証に失敗しました'}}), 502

    email = info.get('email', '')
    name = info.get('name') or email.split('@')[0]
    picture = info.get('picture', '')

    if not email:
        return jsonify({'error': {'code': 'NO_EMAIL', 'message': 'メールアドレスが取得できませんでした'}}), 400

    # Find or create user
    user = user_storage.get_by_email(email)
    if not user:
        try:
            user = user_storage.create({
                'email': email,
                'password_hash': 'google_oauth',
                'name': name,
                'plan': 'free',
                'auth_provider': 'google',
                'avatar': picture,
            })
        except ValueError:
            user = user_storage.get_by_email(email)
    elif picture and not user.get('avatar'):
        # Store avatar on first Google login
        user_storage.update(user['id'], {'avatar': picture})
        user['avatar'] = picture

    token_data = create_access_token(user['id'], user['email'])

    return jsonify({
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'avatar': user.get('avatar'),
            'plan': user.get('plan', 'free'),
        },
        'accessToken': token_data['access_token'],
        'refreshToken': '',
        'expiresAt': token_data['expires_at'],
    })

