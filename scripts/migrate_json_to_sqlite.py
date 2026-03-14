#!/usr/bin/env python3
"""
Migrate JSON storage to SQLite.
Reads all JSON files from data/ and inserts into data/burilar.db.

Usage:
    python scripts/migrate_json_to_sqlite.py
"""

import json
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.storage.sqlite_storage import SQLiteStorage, init_db

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')


def load_json(filename):
    """Load a JSON file from the data directory."""
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        print(f"  Skipping {filename} (not found)")
        return []
    with open(path, 'r') as f:
        data = json.load(f)
    if not isinstance(data, list):
        print(f"  Skipping {filename} (not a list)")
        return []
    return data


def migrate_table(table_name, json_file):
    """Migrate a single JSON file to a SQLite table."""
    records = load_json(json_file)
    if not records:
        return 0

    storage = SQLiteStorage(table_name, id_field='id')

    migrated = 0
    for record in records:
        record_id = record.get('id')
        if not record_id:
            print(f"  Skipping record without id in {json_file}")
            continue

        # Check if already exists
        existing = storage.get(record_id)
        if existing:
            print(f"  Skipping {record_id} (already exists)")
            continue

        try:
            storage.create(record)
            migrated += 1
        except Exception as e:
            print(f"  Error migrating {record_id}: {e}")

    return migrated


def main():
    print("=== JSON to SQLite Migration ===\n")

    # Initialize database
    print("Initializing SQLite database...")
    init_db()
    print(f"Database: {os.path.join(DATA_DIR, 'burilar.db')}\n")

    # Migrate each table
    tables = [
        ('users', 'users.json'),
        ('trackings', 'trackings.json'),
        ('chats', 'chats.json'),
        ('notifications', 'notifications.json'),
    ]

    total = 0
    for table, json_file in tables:
        print(f"Migrating {table}...")
        count = migrate_table(table, json_file)
        print(f"  {count} records migrated")
        total += count

    print(f"\nDone! {total} total records migrated.")
    print("\nTo use SQLite backend, set: STORAGE_BACKEND=sqlite in your .env file")


if __name__ == '__main__':
    main()
