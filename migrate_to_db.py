"""
One-time migration script: JSON files -> Supabase PostgreSQL

Run ONCE after:
  1. Running schema.sql in Supabase SQL Editor
  2. Setting SUPABASE_URL and SUPABASE_KEY in your .env file

Usage:
  py -3 migrate_to_db.py

The service-role key (not anon key) is needed to bypass Row Level Security.
Find it in: Supabase Dashboard -> Project Settings -> API -> service_role key
"""

import json
import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

# Validate env vars
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_KEY in your .env file first.")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}


def upsert(table, records):
    """Upsert records into a Supabase table via REST API. Returns (inserted_count, errors)."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    errs = []
    inserted = 0
    for i in range(0, len(records), 100):
        batch = records[i:i + 100]
        r = requests.post(url, headers=HEADERS, json=batch)
        if r.status_code in (200, 201):
            inserted += len(batch)
        else:
            errs.append(f"batch {i//100}: {r.status_code} {r.text[:300]}")
    return inserted, errs


print(f"Connected to Supabase at {SUPABASE_URL}\n")

errors = []


def migrate(label, source_file, table, transform=None):
    """Load a JSON file and upsert all records into a Supabase table."""
    if not os.path.exists(source_file):
        print(f"  [SKIP] {label} - {source_file} not found")
        return

    with open(source_file, encoding="utf-8") as f:
        raw = json.load(f)

    # Normalise: some files are dicts, some are lists
    if isinstance(raw, dict):
        records = list(raw.values())
    else:
        records = raw

    if not records:
        print(f"  [SKIP] {label} - file is empty")
        return

    if transform:
        records = [transform(r) for r in records if r]

    # Normalise keys: PostgREST requires all records in a batch to have identical keys
    all_keys = set()
    for r in records:
        all_keys.update(r.keys())
    records = [{k: r.get(k) for k in all_keys} for r in records]

    total = len(records)
    n_inserted, errs = upsert(table, records)
    for err in errs:
        errors.append(f"{label} {err}")
        print(f"  [ERROR] {label} {err}")

    print(f"  [OK] {label} - {n_inserted}/{total} records migrated to '{table}'")


# Users
print("Migrating users...")

def transform_user(u):
    # Fix typo: auth_probider -> auth_provider
    if "auth_probider" in u:
        u["auth_provider"] = u.pop("auth_probider")
    u.setdefault("auth_provider", "email")
    u.setdefault("avatar", None)
    return u

migrate("Users", "data/users.json", "users", transform=transform_user)

# Chats
print("Migrating chats...")
migrate("Chats", "data/chats.json", "chats")

# Tracking Plans
print("Migrating tracking plans...")

def transform_plan(p):
    p.setdefault("consecutive_not_useful", 0)
    p.setdefault("strategy", {})
    p.setdefault("keywords", [])
    p.setdefault("updates", [])
    p.setdefault("original_query", "")
    p.setdefault("suggested_prompt", "")
    p.setdefault("image_url", "")
    # Drop empty string next_search_time (must be null or valid timestamp)
    if p.get("next_search_time") == "":
        p.pop("next_search_time")
    return p

migrate("Tracking Plans", "burilar_tracking_data.json", "tracking_plans", transform=transform_plan)

# Notifications
print("Migrating notifications...")

def transform_notification(n):
    n.setdefault("read", False)
    n.setdefault("feedback", None)
    n.setdefault("details", None)
    n.setdefault("plan_id", None)
    n.setdefault("link", None)
    return n

migrate("Notifications", "burilar_notifications.json", "notifications", transform=transform_notification)

# Notification Settings
print("Migrating notification settings...")
settings_file = "burilar_notification_settings.json"
if os.path.exists(settings_file):
    with open(settings_file, encoding="utf-8") as f:
        settings = json.load(f)
    settings["id"] = "global"
    n_inserted, errs = upsert("notification_settings", [settings])
    if errs:
        for err in errs:
            errors.append(f"Notification settings {err}")
            print(f"  [ERROR] Notification settings {err}")
    else:
        print("  [OK] Notification settings migrated")
else:
    print("  [SKIP] notification settings file not found - default row already in DB from schema.sql")

# Summary
print()
if errors:
    print(f"Migration completed with {len(errors)} error(s):")
    for err in errors:
        print(f"  - {err}")
else:
    print("Migration completed successfully. All data is now in Supabase.")
    print()
    print("Next steps:")
    print("  1. Set SUPABASE_URL and SUPABASE_KEY in Railway environment variables")
    print("  2. Deploy to Railway - the app will use Supabase automatically")
    print("  3. Verify by checking the Supabase Table Editor")
