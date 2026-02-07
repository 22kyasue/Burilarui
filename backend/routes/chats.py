"""
Chat Routes
Handles chat/conversation CRUD operations.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from backend.storage import chat_storage
from backend.middleware.auth import auth_required, get_current_user

chats_bp = Blueprint('chats', __name__, url_prefix='/api/chats')


@chats_bp.route('', methods=['GET'])
@auth_required
def list_chats():
    """List all chats for the current user."""
    user = get_current_user()
    chats = chat_storage.get_by_user(user['id'])

    # Format response
    result = []
    for chat in chats:
        result.append({
            'id': chat['id'],
            'title': chat.get('title', 'New Chat'),
            'messages': chat.get('messages', []),
            'updatedAt': chat.get('updated_at'),
            'createdAt': chat.get('created_at'),
            'pinned': chat.get('pinned', False),
            'isTracking': chat.get('is_tracking', False),
            'trackingActive': chat.get('tracking_active', False),
            'updateCount': chat.get('update_count', 0),
            'trackingFrequency': chat.get('tracking_frequency'),
            'notificationEnabled': chat.get('notification_enabled', False),
            'notificationGranularity': chat.get('notification_granularity', 'update'),
        })

    return jsonify({'chats': result})


@chats_bp.route('', methods=['POST'])
@auth_required
def create_chat():
    """Create a new chat."""
    user = get_current_user()
    data = request.json or {}

    chat = chat_storage.create_chat(user['id'], {
        'title': data.get('title', 'New Chat'),
        'messages': data.get('messages', []),
        'pinned': data.get('pinned', False),
        'is_tracking': data.get('isTracking', False),
        'tracking_active': data.get('trackingActive', False),
        'tracking_frequency': data.get('trackingFrequency'),
        'notification_enabled': data.get('notificationEnabled', False),
        'notification_granularity': data.get('notificationGranularity', 'update'),
    })

    return jsonify({
        'id': chat['id'],
        'title': chat.get('title', 'New Chat'),
        'messages': chat.get('messages', []),
        'updatedAt': chat.get('updated_at'),
        'createdAt': chat.get('created_at'),
        'pinned': chat.get('pinned', False),
        'isTracking': chat.get('is_tracking', False),
        'trackingActive': chat.get('tracking_active', False),
        'updateCount': chat.get('update_count', 0),
        'trackingFrequency': chat.get('tracking_frequency'),
        'notificationEnabled': chat.get('notification_enabled', False),
        'notificationGranularity': chat.get('notification_granularity', 'update'),
    }), 201


@chats_bp.route('/<chat_id>', methods=['GET'])
@auth_required
def get_chat(chat_id):
    """Get a specific chat."""
    user = get_current_user()
    chat = chat_storage.get_user_chat(user['id'], chat_id)

    if not chat:
        return jsonify({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'チャットが見つかりません'
            }
        }), 404

    return jsonify({
        'id': chat['id'],
        'title': chat.get('title', 'New Chat'),
        'messages': chat.get('messages', []),
        'updatedAt': chat.get('updated_at'),
        'createdAt': chat.get('created_at'),
        'pinned': chat.get('pinned', False),
        'isTracking': chat.get('is_tracking', False),
        'trackingActive': chat.get('tracking_active', False),
        'updateCount': chat.get('update_count', 0),
        'trackingFrequency': chat.get('tracking_frequency'),
        'notificationEnabled': chat.get('notification_enabled', False),
        'notificationGranularity': chat.get('notification_granularity', 'update'),
    })


@chats_bp.route('/<chat_id>', methods=['PUT'])
@auth_required
def update_chat(chat_id):
    """Update a chat."""
    user = get_current_user()
    data = request.json or {}

    # Map camelCase to snake_case
    update_data = {}
    if 'title' in data:
        update_data['title'] = data['title']
    if 'messages' in data:
        update_data['messages'] = data['messages']
    if 'pinned' in data:
        update_data['pinned'] = data['pinned']
    if 'isTracking' in data:
        update_data['is_tracking'] = data['isTracking']
    if 'trackingActive' in data:
        update_data['tracking_active'] = data['trackingActive']
    if 'updateCount' in data:
        update_data['update_count'] = data['updateCount']
    if 'trackingFrequency' in data:
        update_data['tracking_frequency'] = data['trackingFrequency']
    if 'notificationEnabled' in data:
        update_data['notification_enabled'] = data['notificationEnabled']
    if 'notificationGranularity' in data:
        update_data['notification_granularity'] = data['notificationGranularity']

    chat = chat_storage.update_chat(user['id'], chat_id, update_data)

    if not chat:
        return jsonify({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'チャットが見つかりません'
            }
        }), 404

    return jsonify({
        'id': chat['id'],
        'title': chat.get('title', 'New Chat'),
        'messages': chat.get('messages', []),
        'updatedAt': chat.get('updated_at'),
        'createdAt': chat.get('created_at'),
        'pinned': chat.get('pinned', False),
        'isTracking': chat.get('is_tracking', False),
        'trackingActive': chat.get('tracking_active', False),
        'updateCount': chat.get('update_count', 0),
        'trackingFrequency': chat.get('tracking_frequency'),
        'notificationEnabled': chat.get('notification_enabled', False),
        'notificationGranularity': chat.get('notification_granularity', 'update'),
    })


@chats_bp.route('/<chat_id>', methods=['DELETE'])
@auth_required
def delete_chat(chat_id):
    """Delete a chat."""
    user = get_current_user()

    if not chat_storage.delete_chat(user['id'], chat_id):
        return jsonify({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'チャットが見つかりません'
            }
        }), 404

    return '', 204


@chats_bp.route('/<chat_id>/messages', methods=['POST'])
@auth_required
def add_message(chat_id):
    """Add a message to a chat and generate AI response."""
    from backend.utils.ai import call_perplexity
    import time
    
    user = get_current_user()
    data = request.json or {}

    # 1. Add User Message
    user_message = {
        'id': data.get('id'),
        'content': data.get('content', ''),
        'role': data.get('role', 'user'),
        'timestamp': data.get('timestamp'),
        'sources': data.get('sources'),
        'images': data.get('images'),
    }

    chat = chat_storage.add_message(user['id'], chat_id, user_message)

    if not chat:
        return jsonify({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'チャットが見つかりません'
            }
        }), 404

    # 2. Trigger AI Response if it was a user message
    if user_message['role'] == 'user':
        # Construct messages context
        messages = [
            {
                "role": "system",
                "content": "You are a helpful AI assistant. Provide concise and accurate answers in Japanese."
            }
        ]
        
        # Add history (last 10 messages to keep context but avoid token limits)
        for msg in chat['messages'][-10:]:
            messages.append({
                "role": msg['role'],
                "content": msg['content']
            })
            
        try:
            # Call Perplexity
            ai_content = call_perplexity(messages, model="sonar")
            
            # Create Assistant Message
            assistant_message = {
                'id': str(int(time.time() * 1000)),
                'content': ai_content if isinstance(ai_content, str) else ai_content.get('content', ''),
                'role': 'assistant',
                'timestamp': datetime.now().isoformat(),
                'sources': 0  # To be improved with citation parsing
            }
            
            # Save Assistant Message
            chat = chat_storage.add_message(user['id'], chat_id, assistant_message)
            
        except Exception as e:
            print(f"Error generating AI response: {str(e)}")
            # Optionally add an error message to the chat or just log it
            
    return jsonify({
        'id': chat['id'],
        'title': chat.get('title', 'New Chat'),
        'messages': chat.get('messages', []),
        'updatedAt': chat.get('updated_at'),
    })
