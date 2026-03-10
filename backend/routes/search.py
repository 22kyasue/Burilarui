"""
Search Routes
Stateless one-shot search endpoint. No tracking is created.
"""

from flask import Blueprint, request, jsonify, current_app
from backend.middleware.auth import auth_required, get_current_user

search_bp = Blueprint('search', __name__, url_prefix='/api')


@search_bp.route('/search', methods=['POST'])
@auth_required
def search():
    """
    Perform a one-shot search with query analysis.

    Input:  { "query": "...", "chatHistory"?: [...] }

    Response (success):
        {
            "query": "...",
            "resolvedQuery": "...",
            "needsClarification": false,
            "content": "...",
            "status": "completed" | "in_progress",
            "statusExplanation": "...",
            "images": [...]
        }

    Response (clarification needed):
        {
            "query": "...",
            "resolvedQuery": "...",
            "needsClarification": true,
            "reason": "...",
            "questions": ["...", "..."]
        }
    """
    data = request.json or {}
    raw_query = data.get('query', '').strip()
    chat_history = data.get('chatHistory', [])

    if not raw_query:
        return jsonify({'error': {'code': 'VALIDATION_ERROR', 'message': 'Query is required'}}), 400

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
