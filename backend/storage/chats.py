"""
Chat Storage
Handles chat/conversation data persistence. Backend-agnostic (JSON or SQLite).
"""

from typing import List, Dict, Optional
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
CHATS_FILE = os.path.join(DATA_DIR, 'chats.json')


class ChatStorage:
    """Chat-specific storage with user filtering."""

    def __init__(self):
        use_sqlite = os.getenv('STORAGE_BACKEND', '').lower() == 'sqlite'
        if use_sqlite:
            from .sqlite_storage import SQLiteStorage
            self._backend = SQLiteStorage('chats', id_field='id')
        else:
            from .base import JSONFileStorage
            self._backend = JSONFileStorage(CHATS_FILE, id_field='id')

    # --- Delegate base methods ---

    def get(self, key: str) -> Optional[Dict]:
        return self._backend.get(key)

    def get_all(self) -> List[Dict]:
        return self._backend.get_all()

    def query(self, filters: Dict) -> List[Dict]:
        return self._backend.query(filters)

    def create(self, data: Dict) -> Dict:
        return self._backend.create(data)

    def update(self, key: str, data: Dict) -> Optional[Dict]:
        return self._backend.update(key, data)

    def delete(self, key: str) -> bool:
        return self._backend.delete(key)

    def count(self, filters: Dict = None) -> int:
        return self._backend.count(filters)

    # --- Domain methods ---

    def get_by_user(self, user_id: str) -> List[Dict]:
        """Get all chats for a specific user, sorted by updated_at desc."""
        chats = self.query({'user_id': user_id})
        chats.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
        return chats

    def get_user_chat(self, user_id: str, chat_id: str) -> Optional[Dict]:
        """Get a specific chat only if it belongs to the user."""
        chat = self.get(chat_id)
        if chat and chat.get('user_id') == user_id:
            return chat
        return None

    def create_chat(self, user_id: str, data: Dict) -> Dict:
        """Create a new chat for a user."""
        chat_data = {
            'user_id': user_id,
            'title': data.get('title', 'New Chat'),
            'messages': data.get('messages', []),
            'pinned': data.get('pinned', False),
        }
        return self.create(chat_data)

    def update_chat(self, user_id: str, chat_id: str, data: Dict) -> Optional[Dict]:
        """Update a chat only if it belongs to the user."""
        chat = self.get(chat_id)
        if not chat or chat.get('user_id') != user_id:
            return None
        data.pop('user_id', None)
        return self.update(chat_id, data)

    def delete_chat(self, user_id: str, chat_id: str) -> bool:
        """Delete a chat only if it belongs to the user."""
        chat = self.get(chat_id)
        if not chat or chat.get('user_id') != user_id:
            return False
        return self.delete(chat_id)

    def add_message(self, user_id: str, chat_id: str, message: Dict) -> Optional[Dict]:
        """Add a message to a chat."""
        chat = self.get_user_chat(user_id, chat_id)
        if not chat:
            return None

        messages = chat.get('messages', [])
        messages.append(message)

        # Update title from first user message if not set
        if chat.get('title') == 'New Chat' and message.get('role') == 'user':
            title = message.get('content', '')[:50]
            return self.update(chat_id, {'messages': messages, 'title': title})

        return self.update(chat_id, {'messages': messages})


# Singleton instance
chat_storage = ChatStorage()
