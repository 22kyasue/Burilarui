"""
Notifications API Routes
Endpoints for managing user notifications.
"""

import os
from datetime import datetime
from flask import Blueprint, request, jsonify
from backend.storage import JSONFileStorage
from backend.middleware import auth_required, get_current_user

# Create blueprint
notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

# Storage instance
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
notifications_storage = JSONFileStorage(os.path.join(DATA_DIR, 'notifications.json'))


def create_notification(notification_type: str, title: str, message: str,
                        tracking_id: str = None, update_id: str = None) -> dict:
    """
    Helper to create a notification (called internally when tracking updates occur).

    Args:
        notification_type: One of 'tracking_update', 'system', 'digest', 'alert'
        title: Notification title
        message: Notification message
        tracking_id: Optional related tracking ID
        update_id: Optional related update ID

    Returns:
        Created notification dict
    """
    user = get_current_user()
    notification = {
        'user_id': user['id'],
        'type': notification_type,
        'title': title,
        'message': message,
        'timestamp': datetime.now().isoformat(),
        'is_read': False,
        'tracking_id': tracking_id,
        'update_id': update_id,
    }
    return notifications_storage.create(notification)


# ============================================
# API Endpoints
# ============================================

@notifications_bp.route('', methods=['GET'])
@auth_required
def get_notifications():
    """
    Fetch notifications for the current user.

    Query params:
        - unread_only: bool (default: false)
        - limit: int (default: 50)
        - offset: int (default: 0)

    Returns:
        {
            "notifications": [...],
            "unread_count": int
        }
    """
    user = get_current_user()

    # Parse query params
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))

    # Query notifications for this user
    filters = {'user_id': user['id']}
    if unread_only:
        filters['is_read'] = False

    all_notifications = notifications_storage.query(filters)

    # Sort by timestamp descending (newest first)
    all_notifications.sort(key=lambda x: x.get('timestamp', ''), reverse=True)

    # Apply pagination
    paginated = all_notifications[offset:offset + limit]

    # Get unread count
    unread_count = notifications_storage.count({'user_id': user['id'], 'is_read': False})

    return jsonify({
        'notifications': paginated,
        'unread_count': unread_count
    })


@notifications_bp.route('/unread-count', methods=['GET'])
@auth_required
def get_unread_count():
    """
    Get the count of unread notifications.

    Returns:
        { "count": int }
    """
    user = get_current_user()
    count = notifications_storage.count({'user_id': user['id'], 'is_read': False})
    return jsonify({'count': count})


@notifications_bp.route('/<notification_id>/read', methods=['PATCH'])
@auth_required
def mark_notification_read(notification_id):
    """
    Mark a single notification as read.

    Returns:
        { "success": true } or 404 error
    """
    user = get_current_user()

    # Verify notification exists and belongs to user
    notification = notifications_storage.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    if notification.get('user_id') != user['id']:
        return jsonify({'error': 'Notification not found'}), 404

    # Update
    notifications_storage.update(notification_id, {'is_read': True})
    return jsonify({'success': True})


@notifications_bp.route('/mark-read', methods=['POST'])
@auth_required
def mark_notifications_read():
    """
    Mark multiple notifications as read.

    Body:
        { "notification_ids": ["id1", "id2", ...] }

    Returns:
        { "success": true, "updated_count": int }
    """
    user = get_current_user()
    data = request.json or {}
    notification_ids = data.get('notification_ids', [])

    if not notification_ids:
        return jsonify({'error': 'notification_ids is required'}), 400

    # Filter to only IDs belonging to this user
    valid_ids = []
    for nid in notification_ids:
        notification = notifications_storage.get(nid)
        if notification and notification.get('user_id') == user['id']:
            valid_ids.append(nid)

    # Bulk update
    updated_count = notifications_storage.bulk_update(valid_ids, {'is_read': True})

    return jsonify({
        'success': True,
        'updated_count': updated_count
    })


@notifications_bp.route('/mark-all-read', methods=['POST'])
@auth_required
def mark_all_read():
    """
    Mark all notifications as read for the current user.

    Returns:
        { "success": true, "updated_count": int }
    """
    user = get_current_user()

    # Get all unread notifications for this user
    unread = notifications_storage.query({'user_id': user['id'], 'is_read': False})
    ids = [n['id'] for n in unread]

    # Bulk update
    updated_count = notifications_storage.bulk_update(ids, {'is_read': True})

    return jsonify({
        'success': True,
        'updated_count': updated_count
    })


@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@auth_required
def delete_notification(notification_id):
    """
    Delete a single notification.

    Returns:
        { "success": true } or 404 error
    """
    user = get_current_user()

    # Verify notification exists and belongs to user
    notification = notifications_storage.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    if notification.get('user_id') != user['id']:
        return jsonify({'error': 'Notification not found'}), 404

    notifications_storage.delete(notification_id)
    return jsonify({'success': True})


@notifications_bp.route('/all', methods=['DELETE'])
@auth_required
def clear_all_notifications():
    """
    Clear all notifications for the current user.

    Returns:
        { "success": true, "deleted_count": int }
    """
    user = get_current_user()

    # Get all notifications for this user
    all_notifications = notifications_storage.query({'user_id': user['id']})
    ids = [n['id'] for n in all_notifications]

    # Delete each one (since we're filtering by user)
    deleted_count = 0
    for nid in ids:
        if notifications_storage.delete(nid):
            deleted_count += 1

    return jsonify({
        'success': True,
        'deleted_count': deleted_count
    })


# ============================================
# Internal helper for other modules
# ============================================

def notify_tracking_update(tracking_id: str, tracking_title: str, update_summary: str, update_id: str = None):
    """
    Create a notification when a tracking has a new update.
    Called by the tracking module when updates are detected.
    """
    return create_notification(
        notification_type='tracking_update',
        title=f'Update: {tracking_title}',
        message=update_summary,
        tracking_id=tracking_id,
        update_id=update_id
    )
