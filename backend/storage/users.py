"""
User Storage
Picks Supabase when env vars are set, SQLite when STORAGE_BACKEND=sqlite,
otherwise falls back to JSON file.
"""

import os
from typing import Optional, Dict, List
from backend.db import is_db_available

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')


class UserStorage:
    """User storage with email lookup. Backend-agnostic."""

    def __init__(self):
        if is_db_available():
            from .supabase_storage import SupabaseStorage
            self._backend = SupabaseStorage("users")
        elif os.getenv('STORAGE_BACKEND', '').lower() == 'sqlite':
            from .sqlite_storage import SQLiteStorage
            self._backend = SQLiteStorage('users', id_field='id')
        else:
            from .base import JSONFileStorage
            self._backend = JSONFileStorage(USERS_FILE, id_field="id")

    def get(self, key: str) -> Optional[Dict]:
        return self._backend.get(key)

    def get_all(self) -> List[Dict]:
        return self._backend.get_all()

    def get_by_email(self, email: str) -> Optional[Dict]:
        users = self._backend.query({"email": email.lower()})
        return users[0] if users else None

    def create(self, data: Dict) -> Dict:
        if "email" in data:
            data["email"] = data["email"].lower()
        if self.get_by_email(data.get("email", "")):
            raise ValueError("Email already registered")
        return self._backend.create(data)

    def update(self, key: str, data: Dict) -> Optional[Dict]:
        if "email" in data:
            data["email"] = data["email"].lower()
            existing = self.get_by_email(data["email"])
            if existing and existing.get("id") != key:
                raise ValueError("Email already registered")
        return self._backend.update(key, data)

    def delete(self, key: str) -> bool:
        return self._backend.delete(key)

    def query(self, filters) -> List[Dict]:
        return self._backend.query(filters)


user_storage = UserStorage()
