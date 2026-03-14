"""Error logging endpoint — receives batched frontend errors."""

import logging
from flask import Blueprint, request, jsonify

logger = logging.getLogger(__name__)
errors_bp = Blueprint('errors', __name__)


@errors_bp.route('/api/errors/log', methods=['POST'])
def log_errors():
    """Receive a batch of frontend error reports."""
    data = request.get_json(silent=True)
    if not data or 'errors' not in data:
        return jsonify({'status': 'ignored'}), 200

    for entry in data['errors'][:20]:  # Cap per-request
        logger.warning(
            'Frontend error: source=%s message=%s url=%s',
            entry.get('source', 'unknown'),
            entry.get('message', ''),
            entry.get('url', ''),
        )

    return jsonify({'status': 'ok'}), 200
