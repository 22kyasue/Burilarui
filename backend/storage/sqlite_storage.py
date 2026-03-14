"""
SQLite Storage Backend
Implements BaseStorage interface using SQLite for persistence.
"""

import json
import os
import sqlite3
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional

from .base import BaseStorage

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
DB_PATH = os.path.join(DATA_DIR, 'burilar.db')

# Columns that store JSON — serialized/deserialized automatically
JSON_COLUMNS = {
    'messages', 'updates', 'strategy', 'keywords',
    'last_search_result', 'details', 'sources',
    'clarification_info',
}

# Schema for each table
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    auth_provider TEXT DEFAULT 'email',
    avatar TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trackings (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    query TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    frequency TEXT NOT NULL DEFAULT 'daily',
    custom_frequency_hours INTEGER,
    notification_enabled INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'tracking',
    strategy TEXT DEFAULT '{}',
    keywords TEXT DEFAULT '[]',
    last_search_result TEXT DEFAULT '{}',
    last_executed_at TEXT,
    next_execute_at TEXT,
    image_url TEXT DEFAULT '',
    update_count INTEGER NOT NULL DEFAULT 0,
    unread_count INTEGER NOT NULL DEFAULT 0,
    updates TEXT DEFAULT '[]',
    email_enabled INTEGER NOT NULL DEFAULT 1,
    push_enabled INTEGER NOT NULL DEFAULT 1,
    detail_level TEXT DEFAULT 'summary',
    sources TEXT DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT '',
    title TEXT NOT NULL DEFAULT 'New Chat',
    messages TEXT NOT NULL DEFAULT '[]',
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    tracking_id TEXT,
    read INTEGER NOT NULL DEFAULT 0,
    feedback TEXT,
    details TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trackings_user_id ON trackings(user_id);
CREATE INDEX IF NOT EXISTS idx_trackings_is_active ON trackings(is_active);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
"""


def _get_connection() -> sqlite3.Connection:
    """Get a thread-local SQLite connection."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


# Thread-local storage for connections
_local = threading.local()


def _conn() -> sqlite3.Connection:
    if not hasattr(_local, 'connection') or _local.connection is None:
        _local.connection = _get_connection()
    return _local.connection


def init_db():
    """Initialize the SQLite database with schema."""
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = _get_connection()
    conn.executescript(SCHEMA_SQL)
    conn.commit()
    conn.close()


def _serialize_value(key: str, value: Any) -> Any:
    """Serialize Python objects for SQLite storage."""
    if key in JSON_COLUMNS and not isinstance(value, str):
        return json.dumps(value, default=str)
    if isinstance(value, bool):
        return 1 if value else 0
    return value


def _deserialize_row(row: sqlite3.Row) -> Dict:
    """Convert a SQLite row to a Python dict with JSON deserialization."""
    d = dict(row)
    for key in d:
        if key in JSON_COLUMNS and isinstance(d[key], str):
            try:
                d[key] = json.loads(d[key])
            except (json.JSONDecodeError, TypeError):
                pass
        # Convert SQLite integers back to Python bools for known bool columns
        if key in ('is_active', 'is_pinned', 'notification_enabled', 'pinned',
                    'read', 'email_enabled', 'push_enabled'):
            d[key] = bool(d[key]) if d[key] is not None else False
    return d


class SQLiteStorage(BaseStorage):
    """SQLite-based storage implementation."""

    def __init__(self, table: str, id_field: str = 'id'):
        self.table = table
        self.id_field = id_field
        init_db()

    def get(self, key: str) -> Optional[Dict]:
        cursor = _conn().execute(
            f"SELECT * FROM {self.table} WHERE {self.id_field} = ?", (key,)
        )
        row = cursor.fetchone()
        return _deserialize_row(row) if row else None

    def get_all(self) -> List[Dict]:
        cursor = _conn().execute(f"SELECT * FROM {self.table}")
        return [_deserialize_row(row) for row in cursor.fetchall()]

    def query(self, filters: Dict[str, Any] = None) -> List[Dict]:
        if not filters:
            return self.get_all()

        conditions = []
        values = []
        for key, value in filters.items():
            if isinstance(value, bool):
                conditions.append(f"{key} = ?")
                values.append(1 if value else 0)
            else:
                conditions.append(f"{key} = ?")
                values.append(value)

        where = " AND ".join(conditions)
        cursor = _conn().execute(
            f"SELECT * FROM {self.table} WHERE {where}", tuple(values)
        )
        return [_deserialize_row(row) for row in cursor.fetchall()]

    def _get_table_columns(self) -> set:
        """Get the set of column names for this table."""
        cursor = _conn().execute(f"PRAGMA table_info({self.table})")
        return {row[1] for row in cursor.fetchall()}

    def create(self, data: Dict) -> Dict:
        # Generate ID if not provided
        if self.id_field not in data:
            data[self.id_field] = str(int(datetime.now().timestamp() * 1000))

        now = datetime.now().isoformat()
        if 'created_at' not in data:
            data['created_at'] = now
        if 'updated_at' not in data:
            data['updated_at'] = now

        # Only insert columns that exist in the table schema
        valid_columns = self._get_table_columns()
        columns = [k for k in data.keys() if k in valid_columns]
        placeholders = ', '.join(['?'] * len(columns))
        col_names = ', '.join(columns)
        values = [_serialize_value(k, data[k]) for k in columns]

        conn = _conn()
        conn.execute(
            f"INSERT INTO {self.table} ({col_names}) VALUES ({placeholders})",
            tuple(values)
        )
        conn.commit()

        return self.get(data[self.id_field]) or data

    def update(self, key: str, data: Dict) -> Optional[Dict]:
        existing = self.get(key)
        if not existing:
            return None

        data['updated_at'] = datetime.now().isoformat()

        set_clauses = []
        values = []
        for k, v in data.items():
            set_clauses.append(f"{k} = ?")
            values.append(_serialize_value(k, v))

        values.append(key)
        conn = _conn()
        conn.execute(
            f"UPDATE {self.table} SET {', '.join(set_clauses)} WHERE {self.id_field} = ?",
            tuple(values)
        )
        conn.commit()

        return self.get(key)

    def delete(self, key: str) -> bool:
        conn = _conn()
        cursor = conn.execute(
            f"DELETE FROM {self.table} WHERE {self.id_field} = ?", (key,)
        )
        conn.commit()
        return cursor.rowcount > 0

    def delete_all(self) -> int:
        conn = _conn()
        cursor = conn.execute(f"DELETE FROM {self.table}")
        conn.commit()
        return cursor.rowcount

    def count(self, filters: Dict[str, Any] = None) -> int:
        if not filters:
            cursor = _conn().execute(f"SELECT COUNT(*) FROM {self.table}")
            return cursor.fetchone()[0]

        conditions = []
        values = []
        for key, value in filters.items():
            if isinstance(value, bool):
                conditions.append(f"{key} = ?")
                values.append(1 if value else 0)
            else:
                conditions.append(f"{key} = ?")
                values.append(value)

        where = " AND ".join(conditions)
        cursor = _conn().execute(
            f"SELECT COUNT(*) FROM {self.table} WHERE {where}", tuple(values)
        )
        return cursor.fetchone()[0]

    def bulk_update(self, keys: List[str], data: Dict) -> int:
        if not keys:
            return 0

        data['updated_at'] = datetime.now().isoformat()

        set_clauses = []
        set_values = []
        for k, v in data.items():
            set_clauses.append(f"{k} = ?")
            set_values.append(_serialize_value(k, v))

        placeholders = ', '.join(['?'] * len(keys))
        conn = _conn()
        cursor = conn.execute(
            f"UPDATE {self.table} SET {', '.join(set_clauses)} WHERE {self.id_field} IN ({placeholders})",
            tuple(set_values + keys)
        )
        conn.commit()
        return cursor.rowcount
