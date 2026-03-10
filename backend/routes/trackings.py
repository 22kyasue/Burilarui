"""
Tracking Routes
CRUD and execution endpoints for trackings.
"""

from flask import Blueprint, request, jsonify, current_app
from backend.middleware.auth import auth_required, get_current_user
from backend.storage import tracking_storage

trackings_bp = Blueprint('trackings', __name__, url_prefix='/api/trackings')


def _tracking_to_response(tracking: dict) -> dict:
    """Convert storage dict to camelCase API response."""
    return {
        'id': tracking.get('id'),
        'title': tracking.get('title', ''),
        'query': tracking.get('query', ''),
        'description': tracking.get('description', ''),
        'isActive': tracking.get('is_active', False),
        'isPinned': tracking.get('is_pinned', False),
        'frequency': tracking.get('frequency', 'daily'),
        'customFrequencyHours': tracking.get('custom_frequency_hours'),
        'notificationEnabled': tracking.get('notification_enabled', True),
        'status': tracking.get('status', 'tracking'),
        'imageUrl': tracking.get('image_url', ''),
        'updateCount': tracking.get('update_count', 0),
        'unreadCount': tracking.get('unread_count', 0),
        'lastExecutedAt': tracking.get('last_executed_at'),
        'nextExecuteAt': tracking.get('next_execute_at'),
        'createdAt': tracking.get('created_at'),
        'updatedAt': tracking.get('updated_at'),
    }


def _tracking_detail_response(tracking: dict) -> dict:
    """Full tracking response including updates."""
    resp = _tracking_to_response(tracking)
    resp['updates'] = [
        {
            'id': u.get('id'),
            'title': u.get('title', ''),
            'content': u.get('content', ''),
            'timestamp': u.get('timestamp', ''),
            'sources': u.get('sources', []),
            'isRead': u.get('is_read', False),
        }
        for u in tracking.get('updates', [])
    ]
    return resp


def _update_to_response(update: dict) -> dict:
    """Convert a single update to API response."""
    return {
        'id': update.get('id'),
        'title': update.get('title', ''),
        'content': update.get('content', ''),
        'timestamp': update.get('timestamp', ''),
        'sources': update.get('sources', []),
        'isRead': update.get('is_read', False),
    }


# ------------------------------------------------------------------
# CRUD
# ------------------------------------------------------------------

@trackings_bp.route('', methods=['POST'])
@auth_required
def create_tracking():
    """
    Create a new tracking from a query.

    Input: {
        "query": "...",
        "searchResult"?: "...",
        "frequency"?: "daily",
        "customFrequencyHours"?: 12,
        "notificationEnabled"?: true
    }
    """
    user = get_current_user()
    data = request.json or {}

    query = data.get('query', '').strip()
    if not query:
        return jsonify({'error': {'code': 'VALIDATION_ERROR', 'message': 'Query is required'}}), 400

    tracker = current_app.config['tracker']

    tracking = tracker.create_tracking(
        user_id=user['id'],
        query=query,
        search_result=data.get('searchResult'),
        frequency=data.get('frequency', 'daily'),
        custom_frequency_hours=data.get('customFrequencyHours'),
        notification_enabled=data.get('notificationEnabled', True),
    )

    return jsonify({'tracking': _tracking_to_response(tracking)}), 201


@trackings_bp.route('', methods=['GET'])
@auth_required
def list_trackings():
    """List all trackings for the current user."""
    user = get_current_user()
    trackings = tracking_storage.get_by_user(user['id'])

    return jsonify({
        'trackings': [_tracking_to_response(t) for t in trackings]
    })


@trackings_bp.route('/<tracking_id>', methods=['GET'])
@auth_required
def get_tracking(tracking_id):
    """Get a single tracking with all updates."""
    user = get_current_user()
    tracking = tracking_storage.get_user_tracking(user['id'], tracking_id)

    if not tracking:
        return jsonify({'error': {'code': 'NOT_FOUND', 'message': 'Tracking not found'}}), 404

    return jsonify({'tracking': _tracking_detail_response(tracking)})


@trackings_bp.route('/<tracking_id>', methods=['PATCH'])
@auth_required
def update_tracking(tracking_id):
    """
    Update tracking settings.

    Input: { "isActive"?, "isPinned"?, "frequency"?, "customFrequencyHours"?, "notificationEnabled"? }
    """
    user = get_current_user()
    data = request.json or {}

    # Map camelCase input to snake_case storage
    update_data = {}
    if 'isActive' in data:
        update_data['is_active'] = data['isActive']
    if 'isPinned' in data:
        update_data['is_pinned'] = data['isPinned']
    if 'frequency' in data:
        update_data['frequency'] = data['frequency']
    if 'customFrequencyHours' in data:
        update_data['custom_frequency_hours'] = data['customFrequencyHours']
    if 'notificationEnabled' in data:
        update_data['notification_enabled'] = data['notificationEnabled']
    if 'title' in data:
        update_data['title'] = data['title']
    if 'description' in data:
        update_data['description'] = data['description']

    tracking = tracking_storage.update_tracking(user['id'], tracking_id, update_data)

    if not tracking:
        return jsonify({'error': {'code': 'NOT_FOUND', 'message': 'Tracking not found'}}), 404

    return jsonify({'tracking': _tracking_to_response(tracking)})


@trackings_bp.route('/<tracking_id>', methods=['DELETE'])
@auth_required
def delete_tracking(tracking_id):
    """Delete a tracking."""
    user = get_current_user()

    if not tracking_storage.delete_tracking(user['id'], tracking_id):
        return jsonify({'error': {'code': 'NOT_FOUND', 'message': 'Tracking not found'}}), 404

    return '', 204


# ------------------------------------------------------------------
# Execution
# ------------------------------------------------------------------

@trackings_bp.route('/<tracking_id>/execute', methods=['POST'])
@auth_required
def execute_tracking(tracking_id):
    """Manually trigger a tracking refresh."""
    user = get_current_user()

    # Verify tracking exists
    tracking = tracking_storage.get_user_tracking(user['id'], tracking_id)
    if not tracking:
        return jsonify({'error': {'code': 'NOT_FOUND', 'message': 'Tracking not found'}}), 404

    tracker = current_app.config['tracker']
    update = tracker.execute_tracking(user['id'], tracking_id)

    if update:
        return jsonify({'update': _update_to_response(update)})

    return jsonify({'message': 'No new updates found'})


# ------------------------------------------------------------------
# Updates
# ------------------------------------------------------------------

@trackings_bp.route('/<tracking_id>/updates', methods=['GET'])
@auth_required
def get_updates(tracking_id):
    """Get paginated updates for a tracking."""
    user = get_current_user()

    tracking = tracking_storage.get_user_tracking(user['id'], tracking_id)
    if not tracking:
        return jsonify({'error': {'code': 'NOT_FOUND', 'message': 'Tracking not found'}}), 404

    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('pageSize', 20))

    updates = tracking.get('updates', [])
    total = len(updates)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = updates[start:end]

    return jsonify({
        'updates': [_update_to_response(u) for u in paginated],
        'total': total,
    })


@trackings_bp.route('/<tracking_id>/updates/read', methods=['POST'])
@auth_required
def mark_updates_read(tracking_id):
    """Mark specific updates as read."""
    user = get_current_user()
    data = request.json or {}
    update_ids = data.get('updateIds', [])

    if not update_ids:
        return jsonify({'error': {'code': 'VALIDATION_ERROR', 'message': 'updateIds is required'}}), 400

    count = tracking_storage.mark_updates_read(user['id'], tracking_id, update_ids)
    return jsonify({'success': True, 'updatedCount': count})


@trackings_bp.route('/<tracking_id>/updates/read-all', methods=['POST'])
@auth_required
def mark_all_updates_read(tracking_id):
    """Mark all updates as read for a tracking."""
    user = get_current_user()

    count = tracking_storage.mark_all_updates_read(user['id'], tracking_id)
    return jsonify({'success': True, 'updatedCount': count})
