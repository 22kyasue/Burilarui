"""
Tracking Routes
CRUD and execution endpoints for trackings.
"""

from flask import Blueprint, request, jsonify, current_app
from backend.extensions import limiter
from backend.middleware.auth import auth_required, get_current_user
from backend.storage import tracking_storage
from backend.validation.schemas import validate_request, CREATE_TRACKING_SCHEMA, UPDATE_TRACKING_SCHEMA
from backend.billing.plans import get_limit

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
        'emailEnabled': tracking.get('email_enabled', True),
        'pushEnabled': tracking.get('push_enabled', True),
        'detailLevel': tracking.get('detail_level', 'summary'),
        'sources': tracking.get('sources', []),
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
@limiter.limit("5/minute")
@auth_required
@validate_request(CREATE_TRACKING_SCHEMA)
def create_tracking():
    """Create a new tracking from a query."""
    user = get_current_user()
    v = request.validated
    tracker = current_app.config['tracker']

    # Check active tracking limit
    plan = user.get('plan', 'free')
    limit = get_limit(plan, 'active_trackings')
    if limit >= 0:
        existing = tracking_storage.get_by_user(user['id'])
        active_count = sum(1 for t in existing if t.get('is_active', False))
        if active_count >= limit:
            return jsonify({
                'error': {
                    'code': 'LIMIT_EXCEEDED',
                    'message': f'アクティブ追跡の上限（{limit}件）に達しました。プロプランにアップグレードして上限を引き上げましょう。',
                    'limit_type': 'active_trackings',
                    'used': active_count,
                    'limit': limit,
                }
            }), 429

    tracking = tracker.create_tracking(
        user_id=user['id'],
        query=v['query'],
        search_result=v.get('searchResult'),
        frequency=v.get('frequency', 'daily'),
        custom_frequency_hours=v.get('customFrequencyHours'),
        notification_enabled=v.get('notificationEnabled', True),
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
@validate_request(UPDATE_TRACKING_SCHEMA)
def update_tracking(tracking_id):
    """Update tracking settings."""
    user = get_current_user()
    v = request.validated

    # Map camelCase validated fields to snake_case storage
    field_map = {
        'isActive': 'is_active',
        'isPinned': 'is_pinned',
        'frequency': 'frequency',
        'customFrequencyHours': 'custom_frequency_hours',
        'notificationEnabled': 'notification_enabled',
        'title': 'title',
        'description': 'description',
        'emailEnabled': 'email_enabled',
        'pushEnabled': 'push_enabled',
        'detailLevel': 'detail_level',
        'sources': 'sources',
    }
    update_data = {}
    for camel, snake in field_map.items():
        if v.get(camel) is not None:
            update_data[snake] = v[camel]

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
@limiter.limit("3/minute")
@auth_required
def execute_tracking(tracking_id):
    """Manually trigger a tracking refresh."""
    user = get_current_user()

    # Verify tracking exists
    tracking = tracking_storage.get_user_tracking(user['id'], tracking_id)
    if not tracking:
        return jsonify({'error': {'code': 'NOT_FOUND', 'message': 'Tracking not found'}}), 404

    tracker = current_app.config['tracker']
    try:
        update = tracker.execute_tracking(user['id'], tracking_id)
    except Exception as e:
        return jsonify({'error': 'Tracking execution failed', 'detail': str(e)}), 500

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
