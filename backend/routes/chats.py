"""
Chat Routes
Handles chat/conversation CRUD operations.
"""

import logging
from flask import Blueprint, request, jsonify
from datetime import datetime
from backend.storage import chat_storage
from backend.extensions import limiter
from backend.middleware.auth import auth_required, get_current_user
from backend.validation.schemas import validate_request, CREATE_MESSAGE_SCHEMA
from backend.billing.usage import check_usage_limit

logger = logging.getLogger(__name__)

chats_bp = Blueprint('chats', __name__, url_prefix='/api/chats')


def _chat_to_response(chat: dict) -> dict:
    """Convert storage dict to API response."""
    return {
        'id': chat['id'],
        'title': chat.get('title', 'New Chat'),
        'messages': chat.get('messages', []),
        'updatedAt': chat.get('updated_at'),
        'createdAt': chat.get('created_at'),
        'pinned': chat.get('pinned', False),
    }


@chats_bp.route('', methods=['GET'])
@auth_required
def list_chats():
    """List all chats for the current user."""
    user = get_current_user()
    chats = chat_storage.get_by_user(user['id'])
    return jsonify({'chats': [_chat_to_response(c) for c in chats]})


@chats_bp.route('', methods=['POST'])
@auth_required
@check_usage_limit('chats_per_day')
def create_chat():
    """Create a new chat."""
    user = get_current_user()
    data = request.json or {}

    chat = chat_storage.create_chat(user['id'], {
        'title': data.get('title', 'New Chat'),
        'messages': data.get('messages', []),
        'pinned': data.get('pinned', False),
    })

    return jsonify(_chat_to_response(chat)), 201


@chats_bp.route('/<chat_id>', methods=['GET'])
@auth_required
def get_chat(chat_id):
    """Get a specific chat."""
    user = get_current_user()
    chat = chat_storage.get_user_chat(user['id'], chat_id)

    if not chat:
        return jsonify({'error': {'code': 'NOT_FOUND', 'message': 'Chat not found'}}), 404

    return jsonify(_chat_to_response(chat))


@chats_bp.route('/<chat_id>', methods=['PUT'])
@auth_required
def update_chat(chat_id):
    """Update a chat."""
    user = get_current_user()
    data = request.json or {}

    update_data = {}
    if 'title' in data:
        update_data['title'] = data['title']
    if 'messages' in data:
        update_data['messages'] = data['messages']
    if 'pinned' in data:
        update_data['pinned'] = data['pinned']

    chat = chat_storage.update_chat(user['id'], chat_id, update_data)

    if not chat:
        return jsonify({'error': {'code': 'NOT_FOUND', 'message': 'Chat not found'}}), 404

    return jsonify(_chat_to_response(chat))


@chats_bp.route('/<chat_id>', methods=['DELETE'])
@auth_required
def delete_chat(chat_id):
    """Delete a chat."""
    user = get_current_user()

    if not chat_storage.delete_chat(user['id'], chat_id):
        return jsonify({'error': {'code': 'NOT_FOUND', 'message': 'Chat not found'}}), 404

    return '', 204


@chats_bp.route('/<chat_id>/messages', methods=['POST'])
@limiter.limit("20/minute")
@auth_required
@validate_request(CREATE_MESSAGE_SCHEMA)
def add_message(chat_id):
    """Add a message to a chat and generate AI response."""
    from backend.utils.ai_client import call_ai
    import time

    user = get_current_user()
    v = request.validated

    user_message = {
        'id': v.get('id'),
        'content': v['content'],
        'role': v.get('role', 'user'),
        'timestamp': v.get('timestamp'),
        'sources': v.get('sources'),
        'images': v.get('images'),
    }

    chat = chat_storage.add_message(user['id'], chat_id, user_message)

    if not chat:
        return jsonify({'error': {'code': 'NOT_FOUND', 'message': 'Chat not found'}}), 404

    # Trigger AI response for user messages
    if user_message['role'] == 'user':
        messages = [
            {"role": "system", "content": "You are a helpful AI assistant. Provide concise and accurate answers in Japanese."}
        ]

        for msg in chat['messages'][-10:]:
            messages.append({"role": msg['role'], "content": msg['content']})

        try:
            ai_content = call_ai(messages, task="generation")

            assistant_message = {
                'id': str(int(time.time() * 1000)),
                'content': ai_content if isinstance(ai_content, str) else ai_content.get('content', ''),
                'role': 'assistant',
                'timestamp': datetime.now().isoformat(),
                'sources': 0,
            }

            chat = chat_storage.add_message(user['id'], chat_id, assistant_message)

        except Exception as e:
            logger.error("Error generating AI response: %s", e)
            return jsonify({
                'error': {
                    'code': 'AI_ERROR',
                    'message': 'Failed to generate AI response',
                },
                'id': chat['id'],
                'title': chat.get('title', 'New Chat'),
                'messages': chat.get('messages', []),
                'updatedAt': chat.get('updated_at'),
            }), 500

    return jsonify({
        'id': chat['id'],
        'title': chat.get('title', 'New Chat'),
        'messages': chat.get('messages', []),
        'updatedAt': chat.get('updated_at'),
    })
