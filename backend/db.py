"""
Supabase connection helpers.
Uses REST API directly — no supabase-py client needed.
"""

import os
import requests


def is_db_available() -> bool:
    """True when Supabase env vars are configured."""
    return bool(
        (os.environ.get("SUPABASE_URL") or "").strip() and
        (os.environ.get("SUPABASE_KEY") or "").strip()
    )


def get_supabase():
    """
    Returns a lightweight REST helper instead of supabase-py client.
    Kept for backwards compatibility with tracker/notifier code.
    """
    if not is_db_available():
        return None
    return _RestClient()


class _RestClient:
    """Minimal supabase-py-compatible REST client using requests."""

    def table(self, table_name: str) -> "_TableQuery":
        return _TableQuery(table_name)


class _TableQuery:
    def __init__(self, table: str):
        self.table = table
        self._filters: dict = {}
        self._data = None

    def _url(self) -> str:
        url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
        return f"{url}/rest/v1/{self.table}"

    def _headers(self, prefer: str = "") -> dict:
        key = (os.environ.get("SUPABASE_KEY") or "").strip()
        h = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }
        if prefer:
            h["Prefer"] = prefer
        return h

    def select(self, cols: str = "*") -> "_TableQuery":
        self._select = cols
        return self

    def eq(self, col: str, val) -> "_TableQuery":
        self._filters[col] = f"eq.{val}"
        return self

    def upsert(self, data) -> "_TableQuery":
        self._data = data
        self._op = "upsert"
        return self

    def insert(self, data) -> "_TableQuery":
        self._data = data
        self._op = "insert"
        return self

    def update(self, data) -> "_TableQuery":
        self._data = data
        self._op = "update"
        return self

    def delete(self) -> "_TableQuery":
        self._op = "delete"
        return self

    def execute(self):
        op = getattr(self, "_op", "select")
        params = dict(self._filters)

        if op == "select":
            r = requests.get(self._url(), headers=self._headers(), params=params)
            return _Result(r.json() if r.ok else [])

        elif op in ("insert", "upsert"):
            prefer = "resolution=merge-duplicates,return=representation" if op == "upsert" else "return=representation"
            r = requests.post(self._url(), headers=self._headers(prefer), json=self._data)
            return _Result(r.json() if r.ok else [])

        elif op == "update":
            r = requests.patch(self._url(), headers=self._headers("return=representation"), params=params, json=self._data)
            return _Result(r.json() if r.ok else [])

        elif op == "delete":
            r = requests.delete(self._url(), headers=self._headers(), params=params)
            return _Result([])

        return _Result([])


class _Result:
    def __init__(self, data):
        self.data = data if isinstance(data, list) else []
