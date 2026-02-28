"""
Supabase client singleton.
Import `supabase_client` anywhere in the backend to get a connected client.
Returns None if SUPABASE_URL / SUPABASE_KEY are not set (falls back to JSON).
"""

import os

_client = None


def get_supabase():
    """Return the Supabase client, initialising it on first call."""
    global _client
    if _client is not None:
        return _client

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")

    if not url or not key:
        return None

    from supabase import create_client
    _client = create_client(url, key)
    return _client


def is_db_available() -> bool:
    """True when Supabase env vars are configured."""
    return bool(os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_KEY"))
