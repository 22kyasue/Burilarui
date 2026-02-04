"""
Authentication Utilities
Password hashing and JWT token handling.
"""

import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict

# Configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'burilar-dev-secret-change-in-production')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days for MVP (no refresh tokens)


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
    """
    Create a JWT access token.
    Returns dict with token, expires_at timestamp.
    """
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


def decode_token(token: str) -> Optional[Dict]:
    """
    Decode and validate a JWT token.
    Returns payload dict if valid, None if invalid/expired.
    """
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
