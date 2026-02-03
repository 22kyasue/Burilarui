"""
Authentication Middleware (Placeholder)
Currently a no-op for single-user dev mode.
Will be replaced with real JWT auth later.
"""

from functools import wraps
from flask import request, g

# Placeholder user for dev mode
DEV_USER = {
    'id': 'dev-user-001',
    'email': 'dev@burilar.local',
    'name': 'Dev User',
    'plan_id': 'pro',
}


def get_current_user():
    """
    Get the current authenticated user.
    Currently returns a placeholder dev user.

    TODO: Implement real JWT token validation
    - Extract token from Authorization header
    - Validate token signature
    - Look up user from database
    - Return user or raise 401
    """
    return getattr(g, 'current_user', DEV_USER)


def auth_required(f):
    """
    Decorator to require authentication.
    Currently a no-op that sets dev user.

    TODO: Implement real authentication check
    - Validate JWT token
    - Return 401 if invalid/missing
    - Set g.current_user for downstream use
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # In dev mode, just set the dev user
        g.current_user = DEV_USER

        # TODO: Real implementation would:
        # token = request.headers.get('Authorization', '').replace('Bearer ', '')
        # if not token:
        #     return jsonify({'error': 'Authentication required'}), 401
        # try:
        #     payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        #     g.current_user = get_user_by_id(payload['user_id'])
        # except jwt.InvalidTokenError:
        #     return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated_function
