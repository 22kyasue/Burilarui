"""
Authentication Utilities
Password hashing, JWT access tokens, and refresh token handling.
"""

import logging
import os
import uuid
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict

logger = logging.getLogger(__name__)

# Configuration
JWT_SECRET = os.getenv('JWT_SECRET', '')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_HOURS = 1  # Short-lived access tokens
REFRESH_TOKEN_EXPIRE_DAYS = 30  # Long-lived refresh tokens

# Validate JWT_SECRET on import — fail clearly if missing
if not JWT_SECRET:
    _is_dev = os.getenv('FLASK_DEBUG', '').lower() in ('1', 'true') or os.getenv('FLASK_ENV') == 'development'
    if _is_dev:
        JWT_SECRET = 'burilar-dev-secret-local-only'
        logger.warning("JWT_SECRET not set — using dev fallback. Do NOT use in production.")
    else:
        raise RuntimeError(
            "JWT_SECRET environment variable is required. "
            "Add it to your .env file: JWT_SECRET=your-secure-random-string"
        )

# In-memory refresh token store (will be migrated to DB in 4.1)
# Format: { token_string: { user_id, email, expires_at } }
_refresh_tokens: Dict[str, Dict] = {}


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash."""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> Dict:
    """Create a short-lived JWT access token."""
    expires_at = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)

    payload = {
        'sub': user_id,
        'email': email,
        'exp': expires_at,
        'iat': datetime.utcnow(),
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return {
        'access_token': token,
        'expires_at': int(expires_at.timestamp()),
    }


def create_refresh_token(user_id: str, email: str) -> str:
    """Create an opaque refresh token stored server-side."""
    token = uuid.uuid4().hex + uuid.uuid4().hex  # 64-char random string
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    _refresh_tokens[token] = {
        'user_id': user_id,
        'email': email,
        'expires_at': expires_at,
    }

    return token


def validate_refresh_token(token: str) -> Optional[Dict]:
    """Validate a refresh token. Returns user info if valid, None otherwise."""
    data = _refresh_tokens.get(token)
    if not data:
        return None

    if datetime.utcnow() > data['expires_at']:
        # Expired — clean up
        _refresh_tokens.pop(token, None)
        return None

    return {'user_id': data['user_id'], 'email': data['email']}


def rotate_refresh_token(old_token: str, user_id: str, email: str) -> Optional[str]:
    """Invalidate old refresh token and issue a new one (rotation)."""
    _refresh_tokens.pop(old_token, None)
    return create_refresh_token(user_id, email)


def revoke_refresh_token(token: str) -> bool:
    """Revoke a refresh token (logout)."""
    return _refresh_tokens.pop(token, None) is not None


def revoke_user_refresh_tokens(user_id: str) -> int:
    """Revoke all refresh tokens for a user."""
    to_remove = [t for t, d in _refresh_tokens.items() if d['user_id'] == user_id]
    for t in to_remove:
        _refresh_tokens.pop(t, None)
    return len(to_remove)


def decode_token(token: str) -> Optional[Dict]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {
            'user_id': payload.get('sub'),
            'email': payload.get('email'),
        }
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
