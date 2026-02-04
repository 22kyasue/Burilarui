"""Routes module exports."""

from .notifications import notifications_bp
from .auth import auth_bp
from .chats import chats_bp

__all__ = ['notifications_bp', 'auth_bp', 'chats_bp']
