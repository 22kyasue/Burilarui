"""
Supabase storage backend.
Implements the same BaseStorage interface as JSONFileStorage so that
UserStorage and ChatStorage can swap backends transparently.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from .base import BaseStorage
from backend.db import get_supabase


class SupabaseStorage(BaseStorage):
    """Supabase-backed implementation of BaseStorage."""

    def __init__(self, table: str, id_field: str = "id"):
        self.table = table
        self.id_field = id_field

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _db(self):
        client = get_supabase()
        if client is None:
            raise RuntimeError("Supabase client not initialised — check SUPABASE_URL and SUPABASE_KEY env vars")
        return client

    def _now(self) -> str:
        return datetime.utcnow().isoformat()

    # ------------------------------------------------------------------
    # BaseStorage interface
    # ------------------------------------------------------------------

    def get(self, key: str) -> Optional[Dict]:
        res = self._db().table(self.table).select("*").eq(self.id_field, key).execute()
        return res.data[0] if res.data else None

    def get_all(self) -> List[Dict]:
        res = self._db().table(self.table).select("*").execute()
        return res.data or []

    def query(self, filters: Dict[str, Any] = None) -> List[Dict]:
        q = self._db().table(self.table).select("*")
        if filters:
            for col, val in filters.items():
                q = q.eq(col, val)
        res = q.execute()
        return res.data or []

    def create(self, data: Dict) -> Dict:
        now = self._now()
        if self.id_field not in data:
            data[self.id_field] = str(int(datetime.utcnow().timestamp() * 1000))
        data.setdefault("created_at", now)
        data.setdefault("updated_at", now)
        res = self._db().table(self.table).insert(data).execute()
        return res.data[0] if res.data else data

    def update(self, key: str, data: Dict) -> Optional[Dict]:
        data["updated_at"] = self._now()
        res = (
            self._db()
            .table(self.table)
            .update(data)
            .eq(self.id_field, key)
            .execute()
        )
        return res.data[0] if res.data else None

    def delete(self, key: str) -> bool:
        res = self._db().table(self.table).delete().eq(self.id_field, key).execute()
        return bool(res.data)

    def count(self, filters: Dict[str, Any] = None) -> int:
        return len(self.query(filters))
