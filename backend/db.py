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

    url = (os.environ.get("SUPABASE_URL") or "").strip()
    key = (os.environ.get("SUPABASE_KEY") or "").strip()

    if not url or not key:
        return None

    import sys
    print(f"[DB] Connecting to Supabase. URL={url[:30]}... KEY starts with={key[:10]}... len={len(key)}", file=sys.stderr)

    from supabase import create_client
    _client = create_client(url, key)
    return _client


def is_db_available() -> bool:
    """True when Supabase env vars are configured."""
    return bool(os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_KEY"))
