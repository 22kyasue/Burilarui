"""
Supabase storage backend using REST API directly (no supabase-py).
Uses requests + Supabase PostgREST API for full Python version compatibility.
"""

import os
import requests
from datetime import datetime
from typing import Any, Dict, List, Optional

from .base import BaseStorage


def _get_headers(prefer: str = "return=representation") -> dict:
    key = (os.environ.get("SUPABASE_KEY") or "").strip()
    h = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        h["Prefer"] = prefer
    return h


def _base_url() -> str:
    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    return f"{url}/rest/v1"


class SupabaseStorage(BaseStorage):
    """Supabase-backed storage using REST API directly."""

    def __init__(self, table: str, id_field: str = "id"):
        self.table = table
        self.id_field = id_field

    def _url(self, suffix: str = "") -> str:
        return f"{_base_url()}/{self.table}{suffix}"

    def _now(self) -> str:
        return datetime.utcnow().isoformat()

    # ------------------------------------------------------------------
    # BaseStorage interface
    # ------------------------------------------------------------------

    def get(self, key: str) -> Optional[Dict]:
        r = requests.get(
            self._url(),
            headers=_get_headers(""),
            params={self.id_field: f"eq.{key}"},
        )
        data = r.json() if r.ok else []
        return data[0] if data else None

    def get_all(self) -> List[Dict]:
        r = requests.get(self._url(), headers=_get_headers(""))
        return r.json() if r.ok else []

    def query(self, filters: Dict[str, Any] = None) -> List[Dict]:
        params = {}
        if filters:
            for col, val in filters.items():
                params[col] = f"eq.{val}"
        r = requests.get(self._url(), headers=_get_headers(""), params=params)
        return r.json() if r.ok else []

    def create(self, data: Dict) -> Dict:
        now = self._now()
        if self.id_field not in data:
            data[self.id_field] = str(int(datetime.utcnow().timestamp() * 1000))
        data.setdefault("created_at", now)
        data.setdefault("updated_at", now)
        r = requests.post(
            self._url(),
            headers=_get_headers("return=representation"),
            json=data,
        )
        result = r.json() if r.ok else None
        if isinstance(result, list) and result:
            return result[0]
        return data

    def update(self, key: str, data: Dict) -> Optional[Dict]:
        data["updated_at"] = self._now()
        r = requests.patch(
            self._url(),
            headers=_get_headers("return=representation"),
            params={self.id_field: f"eq.{key}"},
            json=data,
        )
        result = r.json() if r.ok else None
        if isinstance(result, list) and result:
            return result[0]
        return None

    def delete(self, key: str) -> bool:
        r = requests.delete(
            self._url(),
            headers=_get_headers(""),
            params={self.id_field: f"eq.{key}"},
        )
        return r.ok

    def count(self, filters: Dict[str, Any] = None) -> int:
        return len(self.query(filters))
