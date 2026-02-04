"""
User Storage
Handles user data persistence using JSON file storage.
"""

from .base import JSONFileStorage
from typing import Optional, Dict
import os

# Storage file path
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')


class UserStorage(JSONFileStorage):
    """User-specific storage with email lookup."""

    def __init__(self):
        super().__init__(USERS_FILE, id_field='id')

    def get_by_email(self, email: str) -> Optional[Dict]:
        """Get a user by email address."""
        users = self.query({'email': email.lower()})
        return users[0] if users else None

    def create(self, data: Dict) -> Dict:
        """Create a new user with email normalization."""
        # Normalize email to lowercase
        if 'email' in data:
            data['email'] = data['email'].lower()

        # Check for duplicate email
        if self.get_by_email(data.get('email', '')):
            raise ValueError('Email already registered')

        return super().create(data)

    def update(self, key: str, data: Dict) -> Optional[Dict]:
        """Update user with email normalization."""
        if 'email' in data:
            data['email'] = data['email'].lower()
            # Check if new email is taken by another user
            existing = self.get_by_email(data['email'])
            if existing and existing.get('id') != key:
                raise ValueError('Email already registered')

        return super().update(key, data)


# Singleton instance
user_storage = UserStorage()
