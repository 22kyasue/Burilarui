"""
Notification Routes
Endpoints for managing user notifications.
"""

from flask import Blueprint, request, jsonify, current_app
from backend.middleware.auth import auth_required, get_current_user
from backend.storage import notification_storage

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


def _notification_to_response(n: dict) -> dict:
    """Convert storage dict to camelCase API response."""
    return {
        'id': n.get('id'),
        'type': n.get('type', 'info'),
        'title': n.get('title', ''),
        'message': n.get('message', ''),
        'trackingId': n.get('tracking_id'),
        'read': n.get('read', False),
        'feedback': n.get('feedback'),
        'details': n.get('details'),
        'createdAt': n.get('created_at'),
    }


@notifications_bp.route('', methods=['GET'])
@auth_required
def get_notifications():
    """
    List notifications for the current user.

    Query params:
        unread_only: bool (default false)
        limit: int (default 50)
        offset: int (default 0)

    Response: { "notifications": [...], "unreadCount": int }
    """
    user = get_current_user()

    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))

    notifications = notification_storage.get_by_user(
        user['id'], unread_only=unread_only, limit=limit, offset=offset
    )
    unread_count = notification_storage.get_unread_count(user['id'])

    return jsonify({
        'notifications': [_notification_to_response(n) for n in notifications],
        'unreadCount': unread_count,
    })


@notifications_bp.route('/unread-count', methods=['GET'])
@auth_required
def get_unread_count():
    """Get the count of unread notifications."""
    user = get_current_user()
    count = notification_storage.get_unread_count(user['id'])
    return jsonify({'count': count})


@notifications_bp.route('/<notification_id>/read', methods=['PATCH'])
@auth_required
def mark_notification_read(notification_id):
    """Mark a single notification as read."""
    user = get_current_user()

    if not notification_storage.mark_read(user['id'], notification_id):
        return jsonify({'error': {'code': 'NOT_FOUND', 'message': 'Notification not found'}}), 404

    return jsonify({'success': True})


@notifications_bp.route('/mark-all-read', methods=['POST'])
@auth_required
def mark_all_read():
    """Mark all notifications as read."""
    user = get_current_user()

    count = notification_storage.mark_all_read(user['id'])
    return jsonify({'success': True, 'updatedCount': count})


@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@auth_required
def delete_notification(notification_id):
    """Delete a single notification."""
    user = get_current_user()

    if not notification_storage.delete_notification(user['id'], notification_id):
        return jsonify({'error': {'code': 'NOT_FOUND', 'message': 'Notification not found'}}), 404

    return '', 204


@notifications_bp.route('/<notification_id>/feedback', methods=['POST'])
@auth_required
def submit_feedback(notification_id):
    """
    Submit feedback for a notification.

    Input: { "feedback": "useful" | "not_useful" }
    """
    user = get_current_user()
    data = request.json or {}
    feedback = data.get('feedback')

    if feedback not in ('useful', 'not_useful'):
        return jsonify({'error': {'code': 'VALIDATION_ERROR', 'message': 'feedback must be "useful" or "not_useful"'}}), 400

    if not notification_storage.submit_feedback(user['id'], notification_id, feedback):
        return jsonify({'error': {'code': 'NOT_FOUND', 'message': 'Notification not found'}}), 404

    # Trigger adaptive learning if not_useful
    if feedback == 'not_useful':
        notification = notification_storage.get(notification_id)
        tracking_id = notification.get('tracking_id') if notification else None
        if tracking_id:
            tracker = current_app.config['tracker']
            tracker.handle_feedback(user['id'], tracking_id, notification_id, feedback)

    return jsonify({'success': True})
