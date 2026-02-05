"""
Chat Storage
Handles chat/conversation data persistence using JSON file storage.
"""

from .base import JSONFileStorage
from typing import List, Dict, Optional
import os

# Storage file path
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
CHATS_FILE = os.path.join(DATA_DIR, 'chats.json')


class ChatStorage(JSONFileStorage):
    """Chat-specific storage with user filtering."""

    def __init__(self):
        super().__init__(CHATS_FILE, id_field='id')

    def get_by_user(self, user_id: str) -> List[Dict]:
        """Get all chats for a specific user, sorted by updated_at desc."""
        chats = self.query({'user_id': user_id})
        # Sort by updated_at descending
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
            'is_tracking': data.get('is_tracking', False),
            'tracking_active': data.get('tracking_active', False),
            'update_count': data.get('update_count', 0),
            'tracking_frequency': data.get('tracking_frequency'),
            'notification_enabled': data.get('notification_enabled', False),
            'notification_enabled': data.get('notification_enabled', False),
            'notification_granularity': data.get('notification_granularity', 'update'),
            'thumbnail': data.get('thumbnail'),
        }
        return self.create(chat_data)

    def update_chat(self, user_id: str, chat_id: str, data: Dict) -> Optional[Dict]:
        """Update a chat only if it belongs to the user."""
        chat = self.get(chat_id)
        if not chat or chat.get('user_id') != user_id:
            return None

        # Don't allow changing user_id
        if 'user_id' in data:
            del data['user_id']

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
