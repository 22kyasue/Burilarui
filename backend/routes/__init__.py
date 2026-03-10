"""Routes module exports."""

from .auth import auth_bp
from .chats import chats_bp
from .trackings import trackings_bp
from .notifications import notifications_bp
from .search import search_bp

__all__ = ['auth_bp', 'chats_bp', 'trackings_bp', 'notifications_bp', 'search_bp']
