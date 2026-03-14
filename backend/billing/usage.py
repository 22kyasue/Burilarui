"""
Usage tracking and limit enforcement.
Counts daily usage per user and checks against plan limits.
"""

import logging
from datetime import datetime, date
from functools import wraps
from flask import g, jsonify
from backend.billing.plans import get_limit

logger = logging.getLogger(__name__)

# In-memory daily usage counters: { "user_id:type:YYYY-MM-DD": count }
_usage_counts: dict[str, int] = {}


def _usage_key(user_id: str, limit_type: str) -> str:
    today = date.today().isoformat()
    return f"{user_id}:{limit_type}:{today}"


def get_usage(user_id: str, limit_type: str) -> int:
    return _usage_counts.get(_usage_key(user_id, limit_type), 0)


def increment_usage(user_id: str, limit_type: str) -> int:
    key = _usage_key(user_id, limit_type)
    _usage_counts[key] = _usage_counts.get(key, 0) + 1
    return _usage_counts[key]


def get_all_usage(user_id: str, plan_name: str) -> dict:
    """Get all usage stats for a user with their plan limits."""
    usage = {}
    for limit_type in ['searches_per_day', 'chats_per_day']:
        limit = get_limit(plan_name, limit_type)
        used = get_usage(user_id, limit_type)
        usage[limit_type] = {
            'used': used,
            'limit': limit,
            'remaining': max(0, limit - used) if limit >= 0 else -1,
        }
    return usage


def check_usage_limit(limit_type: str):
    """
    Decorator that checks if the user has exceeded their plan limit.
    Must be placed AFTER @auth_required so g.current_user is set.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = g.current_user
            if not user:
                return f(*args, **kwargs)

            plan = user.get('plan', 'free')
            limit = get_limit(plan, limit_type)

            # -1 means unlimited
            if limit < 0:
                increment_usage(user['id'], limit_type)
                return f(*args, **kwargs)

            current = get_usage(user['id'], limit_type)
            if current >= limit:
                logger.info(
                    'Usage limit hit: user=%s plan=%s type=%s limit=%d',
                    user['id'], plan, limit_type, limit,
                )
                return jsonify({
                    'error': {
                        'code': 'LIMIT_EXCEEDED',
                        'message': f'本日の上限（{limit}回）に達しました。プロプランにアップグレードして上限を引き上げましょう。',
                        'limit_type': limit_type,
                        'used': current,
                        'limit': limit,
                    }
                }), 429

            increment_usage(user['id'], limit_type)
            return f(*args, **kwargs)

        return decorated
    return decorator


def cleanup_old_usage():
    """Remove usage entries from previous days. Call from scheduler."""
    today = date.today().isoformat()
    stale = [k for k in _usage_counts if not k.endswith(today)]
    for k in stale:
        del _usage_counts[k]
    if stale:
        logger.info('Cleaned up %d stale usage entries', len(stale))
