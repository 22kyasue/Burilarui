"""
Chat Storage
Picks Supabase when env vars are set, otherwise falls back to JSON file.
"""

import os
from typing import List, Dict, Optional
from backend.db import is_db_available

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
CHATS_FILE = os.path.join(DATA_DIR, 'chats.json')


class ChatStorage:
    """Chat storage with user filtering. Backend-agnostic."""

    def __init__(self):
        if is_db_available():
            from .supabase_storage import SupabaseStorage
            self._backend = SupabaseStorage("chats")
        else:
            from .base import JSONFileStorage
            self._backend = JSONFileStorage(CHATS_FILE, id_field="id")

    def get_by_user(self, user_id: str) -> List[Dict]:
        chats = self._backend.query({"user_id": user_id})
        chats.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        return chats

    def get_user_chat(self, user_id: str, chat_id: str) -> Optional[Dict]:
        chat = self._backend.get(chat_id)
        if chat and chat.get("user_id") == user_id:
            return chat
        return None

    def create_chat(self, user_id: str, data: Dict) -> Dict:
        chat_data = {
            "user_id": user_id,
            "title": data.get("title", "New Chat"),
            "messages": data.get("messages", []),
            "pinned": data.get("pinned", False),
            "is_tracking": data.get("is_tracking", False),
            "tracking_active": data.get("tracking_active", False),
            "update_count": data.get("update_count", 0),
            "tracking_frequency": data.get("tracking_frequency"),
            "notification_enabled": data.get("notification_enabled", False),
            "notification_granularity": data.get("notification_granularity", "update"),
            "thumbnail": data.get("thumbnail"),
        }
        return self._backend.create(chat_data)

    def update_chat(self, user_id: str, chat_id: str, data: Dict) -> Optional[Dict]:
        chat = self._backend.get(chat_id)
        if not chat or chat.get("user_id") != user_id:
            return None
        data.pop("user_id", None)
        return self._backend.update(chat_id, data)

    def delete_chat(self, user_id: str, chat_id: str) -> bool:
        chat = self._backend.get(chat_id)
        if not chat or chat.get("user_id") != user_id:
            return False
        return self._backend.delete(chat_id)

    def add_message(self, user_id: str, chat_id: str, message: Dict) -> Optional[Dict]:
        chat = self.get_user_chat(user_id, chat_id)
        if not chat:
            return None
        messages = chat.get("messages", [])
        messages.append(message)
        update_data = {"messages": messages}
        if chat.get("title") == "New Chat" and message.get("role") == "user":
            update_data["title"] = message.get("content", "")[:50]
        return self._backend.update(chat_id, update_data)


chat_storage = ChatStorage()
