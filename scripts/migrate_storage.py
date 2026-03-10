"""
Migration script: Move old tracking and notification data into the unified storage format.

Old format:
  - burilar_tracking_data.json: dict keyed by plan ID, TrackingPlan fields
  - burilar_notifications.json: list of notification dicts (NotificationManager format)

New format:
  - data/trackings.json: list of tracking dicts (TrackingStorage format)
  - data/notifications.json: list of notification dicts (NotificationStorage format)

Run once: python scripts/migrate_storage.py
"""

import json
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')

OLD_TRACKING_FILE = os.path.join(PROJECT_ROOT, 'burilar_tracking_data.json')
OLD_NOTIFICATION_FILE = os.path.join(PROJECT_ROOT, 'burilar_notifications.json')
NEW_TRACKING_FILE = os.path.join(DATA_DIR, 'trackings.json')
NEW_NOTIFICATION_FILE = os.path.join(DATA_DIR, 'notifications.json')

# Frequency hours to named frequency mapping
def hours_to_frequency(hours: int) -> tuple:
    """Convert frequency_hours to (frequency_name, custom_hours)."""
    if hours <= 1:
        return ('hourly', None)
    elif hours <= 12:
        return ('custom', hours)
    elif hours <= 24:
        return ('daily', None)
    elif hours <= 168:
        return ('weekly', None)
    else:
        return ('custom', hours)


def migrate_trackings():
    """Migrate burilar_tracking_data.json -> data/trackings.json"""
    if not os.path.exists(OLD_TRACKING_FILE):
        print(f"  Skipping: {OLD_TRACKING_FILE} not found")
        return 0

    with open(OLD_TRACKING_FILE, 'r') as f:
        old_data = json.load(f)

    # Old format is a dict keyed by plan ID
    if not isinstance(old_data, dict):
        print(f"  Skipping: unexpected format (expected dict, got {type(old_data).__name__})")
        return 0

    new_trackings = []
    for plan_id, plan in old_data.items():
        # Map old fields to new schema
        freq_hours = plan.get('frequency_hours', 24)
        frequency, custom_hours = hours_to_frequency(freq_hours)

        # Migrate updates: add is_read and id fields if missing
        old_updates = plan.get('updates', [])
        new_updates = []
        for i, update in enumerate(old_updates):
            new_update = {
                'id': update.get('id', f"{plan_id}_update_{i}"),
                'title': update.get('details', {}).get('summary', update.get('update', ''))[:80],
                'content': update.get('update', ''),
                'timestamp': update.get('timestamp', ''),
                'sources': update.get('details', {}).get('sources', []),
                'is_read': False,
                'details': update.get('details', {}),
            }
            new_updates.append(new_update)

        tracking = {
            'id': plan.get('id', plan_id),
            'user_id': plan.get('user_id'),
            'title': plan.get('topic', plan.get('original_query', '')),
            'query': plan.get('original_query', plan.get('topic', '')),
            'description': plan.get('objective', ''),
            'is_active': plan.get('active', False),
            'is_pinned': False,
            'frequency': frequency,
            'custom_frequency_hours': custom_hours,
            'notification_enabled': True,
            'status': plan.get('status', 'tracking'),
            'strategy': plan.get('strategy', {}),
            'keywords': plan.get('keywords', []),
            'last_search_result': plan.get('last_search_result', {}),
            'last_executed_at': plan.get('last_search_time'),
            'next_execute_at': plan.get('next_search_time'),
            'image_url': plan.get('image_url', ''),
            'update_count': len(new_updates),
            'unread_count': sum(1 for u in new_updates if not u.get('is_read')),
            'updates': new_updates,
            'created_at': plan.get('created_at', ''),
            'updated_at': plan.get('created_at', ''),
        }
        new_trackings.append(tracking)

    # Write to new file
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(NEW_TRACKING_FILE, 'w') as f:
        json.dump(new_trackings, f, indent=2, default=str)

    return len(new_trackings)


def migrate_notifications():
    """Migrate burilar_notifications.json -> data/notifications.json"""
    if not os.path.exists(OLD_NOTIFICATION_FILE):
        print(f"  Skipping: {OLD_NOTIFICATION_FILE} not found")
        return 0

    with open(OLD_NOTIFICATION_FILE, 'r') as f:
        old_notifications = json.load(f)

    if not isinstance(old_notifications, list):
        print(f"  Skipping: unexpected format (expected list, got {type(old_notifications).__name__})")
        return 0

    # Load existing data/notifications.json (may have entries from old blueprint)
    existing = []
    if os.path.exists(NEW_NOTIFICATION_FILE):
        with open(NEW_NOTIFICATION_FILE, 'r') as f:
            try:
                existing = json.load(f)
            except json.JSONDecodeError:
                existing = []

    existing_ids = {n.get('id') for n in existing}

    new_notifications = list(existing)  # Start with existing
    migrated = 0

    for n in old_notifications:
        if n.get('id') in existing_ids:
            continue  # Skip duplicates

        notification = {
            'id': n.get('id'),
            'user_id': n.get('user_id'),  # Old NotificationManager didn't track user_id
            'type': n.get('type', 'info'),
            'title': n.get('title', ''),
            'message': n.get('message', ''),
            'tracking_id': n.get('plan_id'),  # Old field was plan_id
            'read': n.get('read', False),
            'feedback': n.get('feedback'),
            'details': n.get('details'),
            'created_at': n.get('timestamp', ''),
            'updated_at': n.get('timestamp', ''),
        }
        new_notifications.append(notification)
        migrated += 1

    # Write merged result
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(NEW_NOTIFICATION_FILE, 'w') as f:
        json.dump(new_notifications, f, indent=2, default=str)

    return migrated


def main():
    print("=== Burilar Storage Migration ===\n")

    print("1. Migrating trackings...")
    count = migrate_trackings()
    print(f"   Migrated {count} trackings -> {NEW_TRACKING_FILE}\n")

    print("2. Migrating notifications...")
    count = migrate_notifications()
    print(f"   Migrated {count} notifications -> {NEW_NOTIFICATION_FILE}\n")

    print("=== Migration complete ===")
    print("\nAfter verifying the new files, you can delete:")
    print(f"  - {OLD_TRACKING_FILE}")
    print(f"  - {OLD_NOTIFICATION_FILE}")


if __name__ == '__main__':
    main()
