"""
Search Routes
Stateless one-shot search endpoint. No tracking is created.
"""

from flask import Blueprint, request, jsonify, current_app
from backend.extensions import limiter
from backend.middleware.auth import auth_required, get_current_user
from backend.validation.schemas import validate_request, SEARCH_SCHEMA
from backend.billing.usage import check_usage_limit

search_bp = Blueprint('search', __name__, url_prefix='/api')


@search_bp.route('/search', methods=['POST'])
@limiter.limit("10/minute")
@auth_required
@check_usage_limit('searches_per_day')
@validate_request(SEARCH_SCHEMA)
def search():
    """
    Perform a one-shot search with query analysis.

    Input:  { "query": "...", "chatHistory"?: [...] }
    """
    raw_query = request.validated['query']
    chat_history = request.validated.get('chatHistory') or []

    tracker = current_app.config['tracker']

    # Step 1: Process query (normalize, feasibility, ambiguity)
    analysis = tracker.process_query(raw_query, chat_history)

    if analysis.get('needs_clarification'):
        return jsonify({
            'query': raw_query,
            'resolvedQuery': analysis.get('resolved_query', raw_query),
            'needsClarification': True,
            'reason': analysis.get('reason', ''),
            'questions': analysis.get('questions', []),
        })

    # Step 2: Perform search
    resolved_query = analysis.get('resolved_query', raw_query)
    search_result = tracker.search(resolved_query)

    return jsonify({
        'query': raw_query,
        'resolvedQuery': resolved_query,
        'needsClarification': False,
        'content': search_result.get('content', ''),
        'status': search_result.get('status', 'completed'),
        'statusExplanation': search_result.get('explanation', ''),
        'images': search_result.get('images', []),
    })
