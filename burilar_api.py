import json
import os
import time
import threading
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS

from backend.core.tracker import BurilarTracker
from backend.models.tracking import TrackingPlan

"""
Burilar API Backend
Version: 1.1.1 (Modularized)
"""

# Initialize Flask app - serve static files from build folder
app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app)

# Register API blueprints
from backend.routes import notifications_bp, auth_bp, chats_bp
from backend.middleware.auth import auth_optional, auth_required, get_current_user
# app.register_blueprint(notifications_bp) # DIABLED: Using tracker.notifier instead
app.register_blueprint(auth_bp)
app.register_blueprint(chats_bp)

# Initialize tracker
tracker = BurilarTracker()

# REST API Endpoints

@app.route('/')
def index():
    """Serve the main web interface."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files or fallback to index.html for SPA routing."""
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/search', methods=['POST'])
@auth_optional
def initial_search():
    """Perform initial search and assess topic status."""
    user = get_current_user()
    user_id = user['id'] if user else None

    data = request.json
    raw_query = data.get('query')
    chat_history = data.get('chat_history', []) # Expect frontend to send this

    if not raw_query:
        return jsonify({'error': 'Query is required'}), 400

    # Process query (Context, Feasibility, Ambiguity)
    analysis = tracker.process_query(raw_query, chat_history)
    resolved_query = analysis.get('resolved_query', raw_query)

    if analysis.get('needs_clarification'):
        # Save this as a plan with "needs_clarification" status
        plan = TrackingPlan(
            topic=resolved_query,
            objective="Needs clarification",
            frequency_hours=12,
            keywords=[],
            status="needs_clarification",
            user_id=user_id
        )
        plan.original_query = raw_query
        plan.clarification_info = {
            'reason': analysis.get('reason', 'Query is ambiguous'),
            'questions': analysis.get('clarification_questions', [])
        }
        tracker.tracking_plans[plan.id] = plan
        tracker.save_tracking_plans()

        return jsonify({
            'query': raw_query,
            'resolved_query': resolved_query,
            'plan_id': plan.id,
            'needs_clarification': True,
            'reason': analysis.get('reason'),
            'clarification_questions': analysis.get('clarification_questions', [])
        })

    # Perform initial search using the RESOLVED query
    search_enhanced = tracker.search_with_ai_enhanced(resolved_query)
    search_result = search_enhanced['content']
    images = search_enhanced.get('images', [])

    # Assess status
    status_info = tracker.assess_topic_status(search_result)

    response = {
        'query': raw_query,
        'resolved_query': resolved_query,
        'needs_clarification': False,
        'search_result': search_result,
        'status': status_info['status'],
        'status_explanation': status_info['explanation']
    }

    # Create and save plan regardless of status
    if status_info['status'] == 'in_progress':
        plan = tracker.generate_tracking_plan(resolved_query, search_result)
        plan.user_id = user_id
        plan.last_search_result = search_result
        if images:
             plan.image_url = images[0]
        plan.status = "pending"  # Waiting for user to start tracking
        plan.original_query = raw_query
        response['proposed_plan'] = {
            'topic': plan.topic,
            'objective': plan.objective,
            'frequency_hours': plan.frequency_hours,
            'keywords': plan.keywords,
            'plan_id': plan.id,
            'suggested_prompt': plan.suggested_prompt,
            'image_url': plan.image_url,
            'structure_items': plan.strategy.get('structure_items', []),
            'missing_points': plan.strategy.get('missing_points', []),
            'notification_triggers': plan.strategy.get('notification_triggers', [])
        }
    else:
        # Status is "completed" - save as a completed search
        plan = TrackingPlan(
            topic=resolved_query,
            objective="Query resolved",
            frequency_hours=12,
            keywords=[],
            status="completed",
            user_id=user_id
        )
        plan.last_search_result = search_result
        plan.original_query = raw_query
        response['plan_id'] = plan.id

    # Store the plan
    tracker.tracking_plans[plan.id] = plan
    tracker.save_tracking_plans()

    return jsonify(response)

@app.route('/api/tracking/start', methods=['POST'])
@auth_optional
def start_tracking():
    """Start tracking a plan."""
    user = get_current_user()
    user_id = user['id'] if user else None

    data = request.json
    plan_id = data.get('plan_id')
    frequency_hours = data.get('frequency_hours')

    if not plan_id or plan_id not in tracker.tracking_plans:
        return jsonify({'error': 'Invalid plan_id'}), 400

    plan = tracker.tracking_plans[plan_id]

    # Check ownership
    if plan.user_id and plan.user_id != user_id:
        return jsonify({'error': 'Plan not found'}), 404

    # Update frequency if provided
    if frequency_hours:
        plan.frequency_hours = frequency_hours

    tracker.start_tracking(plan)

    return jsonify({
        'message': 'Tracking started',
        'plan': plan.to_dict()
    })

@app.route('/api/tracking/list', methods=['GET'])
@auth_optional
def list_tracking():
    """List all tracking plans for the current user."""
    user = get_current_user()
    user_id = user['id'] if user else None

    # Filter plans by user_id (or show all if no user)
    if user_id:
        plans = [plan.to_dict() for plan in tracker.tracking_plans.values() if plan.user_id == user_id]
    else:
        # For unauthenticated users, only show plans without user_id (legacy/public)
        plans = [plan.to_dict() for plan in tracker.tracking_plans.values() if plan.user_id is None]

    return jsonify({'plans': plans})

@app.route('/api/tracking/<plan_id>', methods=['GET'])
@auth_optional
def get_tracking_plan(plan_id):
    """Get details of a specific tracking plan."""
    user = get_current_user()
    user_id = user['id'] if user else None

    if plan_id not in tracker.tracking_plans:
        return jsonify({'error': 'Plan not found'}), 404

    plan = tracker.tracking_plans[plan_id]

    # Check ownership
    if plan.user_id and plan.user_id != user_id:
        return jsonify({'error': 'Plan not found'}), 404

    return jsonify(plan.to_dict())

@app.route('/api/tracking/<plan_id>/stop', methods=['POST'])
@auth_optional
def stop_tracking(plan_id):
    """Stop tracking a plan."""
    user = get_current_user()
    user_id = user['id'] if user else None

    if plan_id not in tracker.tracking_plans:
        return jsonify({'error': 'Plan not found'}), 404

    plan = tracker.tracking_plans[plan_id]

    # Check ownership
    if plan.user_id and plan.user_id != user_id:
        return jsonify({'error': 'Plan not found'}), 404

    plan.active = False
    tracker.save_tracking_plans()

    return jsonify({'message': 'Tracking stopped'})

@app.route('/api/tracking/<plan_id>/delete', methods=['DELETE'])
@auth_optional
def delete_tracking(plan_id):
    """Delete a tracking plan."""
    user = get_current_user()
    user_id = user['id'] if user else None

    if plan_id not in tracker.tracking_plans:
        return jsonify({'error': 'Plan not found'}), 404

    plan = tracker.tracking_plans[plan_id]

    # Check ownership
    if plan.user_id and plan.user_id != user_id:
        return jsonify({'error': 'Plan not found'}), 404

    del tracker.tracking_plans[plan_id]
    tracker.save_tracking_plans()

    return jsonify({'message': 'Tracking plan deleted'})

@app.route('/api/tracking/check', methods=['POST'])
def check_updates():
    """Manually check for updates on all active tracking plans."""
    updates = tracker.check_tracking_updates()
    return jsonify({'updates': updates})

# Background thread to check for updates periodically
def background_checker():
    while True:
        time.sleep(300)  # Check every 5 minutes
        tracker.check_tracking_updates()

# Start background thread
checker_thread = threading.Thread(target=background_checker, daemon=True)
checker_thread.start()

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    """Get unread notifications."""
    unread_only = request.args.get('unread_only', 'true').lower() == 'true'
    notifications = tracker.notifier.get_notifications(unread_only=unread_only, limit=50)
    return jsonify(notifications)

@app.route('/api/notifications/read', methods=['POST'])
def mark_notification_read():
    """Mark a notification as read."""
    data = request.json
    notification_id = data.get('id')
    if not notification_id:
        return jsonify({"error": "Missing notification id"}), 400
        
    success = tracker.notifier.mark_as_read(notification_id)
    if success:
        return jsonify({"status": "success"})
    return jsonify({"error": "Notification not found"}), 404

@app.route('/api/notifications/<notification_id>/feedback', methods=['POST'])
def submit_notification_feedback(notification_id):
    """Submit feedback for a notification."""
    data = request.json
    feedback = data.get('feedback')

    if not feedback or feedback not in ['useful', 'not_useful']:
        return jsonify({"error": "Invalid feedback type"}), 400

    success = tracker.notifier.submit_feedback(notification_id, feedback)
    if not success:
        return jsonify({"error": "Notification not found"}), 404

    # Find the notification to get its plan_id
    notification = tracker.notifier.get_notification_by_id(notification_id)
    plan_id = notification.get("plan_id") if notification else None

    if plan_id and plan_id in tracker.tracking_plans:
        plan = tracker.tracking_plans[plan_id]

        if feedback == "useful":
            plan.consecutive_not_useful = 0
            tracker.save_tracking_plans()

        elif feedback == "not_useful":
            plan.consecutive_not_useful += 1
            tracker.save_tracking_plans()

            if plan.consecutive_not_useful >= 3:
                try:
                    updated = tracker.architect.refine_from_feedback(plan)

                    plan.strategy.update({
                        'search_queries': updated.get('search_queries', []),
                        'structure_items': updated.get('structure_items', []),
                        'missing_points': updated.get('missing_points', []),
                        'notification_triggers': updated.get('notification_triggers', [])
                    })
                    if updated.get('keywords'):
                        plan.keywords = updated['keywords']
                    plan.consecutive_not_useful = 0
                    tracker.save_tracking_plans()

                    tracker.notifier.add_notification(
                        title="追跡戦略が更新されました",
                        message=updated.get('change_summary',
                            "フィードバックに基づき、より関連性の高い情報を追跡するよう戦略を更新しました。"),
                        type="info",
                        plan_id=plan_id
                    )

                    return jsonify({
                        "status": "success",
                        "adapted": True,
                        "message": updated.get('change_summary', '戦略を更新しました')
                    })
                except Exception as e:
                    print(f"[adaptive] Refinement failed: {e}")
                    # Fall through to standard success response

    return jsonify({"status": "success", "adapted": False})

@app.route('/api/tracking/<plan_id>', methods=['PATCH'])
@auth_optional
def update_tracking_plan(plan_id):
    """Update frequency or active status of a tracking plan."""
    user = get_current_user()
    user_id = user['id'] if user else None

    if plan_id not in tracker.tracking_plans:
        return jsonify({'error': 'Plan not found'}), 404

    plan = tracker.tracking_plans[plan_id]

    if plan.user_id and plan.user_id != user_id:
        return jsonify({'error': 'Plan not found'}), 404

    data = request.json or {}
    if 'frequency_hours' in data:
        plan.frequency_hours = int(data['frequency_hours'])
    if 'active' in data:
        plan.active = bool(data['active'])

    tracker.save_tracking_plans()
    return jsonify({'message': 'Plan updated', 'plan': plan.to_dict()})


@app.route('/api/tracking/<plan_id>/refine', methods=['POST'])
@auth_optional
def refine_tracking_plan(plan_id):
    """Refine a tracking plan's strategy based on user feedback."""
    user = get_current_user()
    user_id = user['id'] if user else None

    if plan_id not in tracker.tracking_plans:
        return jsonify({'error': 'Plan not found'}), 404

    plan = tracker.tracking_plans[plan_id]

    if plan.user_id and plan.user_id != user_id:
        return jsonify({'error': 'Plan not found'}), 404

    data = request.json or {}
    message = data.get('message', '').strip()
    if not message:
        return jsonify({'error': 'Message is required'}), 400

    try:
        current_queries = plan.strategy.get('search_queries', [])
        prompt = f"""You are refining a research tracking strategy based on user feedback.

Current topic: {plan.topic}
Current search queries: {json.dumps(current_queries, ensure_ascii=False)}
User feedback: {message}

Update the tracking strategy based on the feedback.
Return a JSON object with:
{{
  "search_queries": ["query1", "query2", "query3"],
  "structure_items": [{{"color": "indigo", "title": "...", "description": "..."}}],
  "missing_points": [{{"text": "..."}}],
  "notification_triggers": [{{"text": "..."}}],
  "summary": "Brief description of what changed and why"
}}"""

        from backend.utils.ai_client import call_ai
        response_text = call_ai([{"role": "user", "content": prompt}], task="generation")

        # Parse JSON from response
        import re as _re
        json_match = _re.search(r'\{[\s\S]*\}', response_text)
        if not json_match:
            raise ValueError("No JSON in response")
        updated = json.loads(json_match.group())

        # Apply updates to plan
        if 'search_queries' in updated:
            plan.strategy['search_queries'] = updated['search_queries']
            plan.keywords = updated['search_queries'][:5]
        for field in ('structure_items', 'missing_points', 'notification_triggers'):
            if field in updated:
                plan.strategy[field] = updated[field]

        tracker.save_tracking_plans()

        return jsonify({
            'success': True,
            'summary': updated.get('summary', '追跡戦略を更新しました'),
            'updated_plan': {
                'search_queries': plan.strategy.get('search_queries', []),
                'structure_items': plan.strategy.get('structure_items', []),
                'missing_points': plan.strategy.get('missing_points', []),
                'notification_triggers': plan.strategy.get('notification_triggers', []),
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/tracking/<plan_id>/execute', methods=['POST'])
@auth_optional
def execute_tracking_plan(plan_id):
    """Manually trigger a single tracking plan update."""
    user = get_current_user()
    user_id = user['id'] if user else None

    if plan_id not in tracker.tracking_plans:
        return jsonify({'error': 'Plan not found'}), 404

    plan = tracker.tracking_plans[plan_id]

    if plan.user_id and plan.user_id != user_id:
        return jsonify({'error': 'Plan not found'}), 404

    try:
        from datetime import datetime
        search_content = tracker.executor.execute_plan(plan)
        content_text = search_content.get('content', '') if isinstance(search_content, dict) else search_content
        schema_type = plan.strategy.get('schema_type', 'topic_watch')
        new_data = tracker.extractor.extract_data(content_text, schema_type)

        update_obj = None
        if plan.last_search_result and isinstance(plan.last_search_result, dict):
            diff = tracker._detect_structured_diff(plan.last_search_result, new_data, schema_type)
            if diff:
                update_obj = diff
                if isinstance(search_content, dict) and 'citations' in search_content:
                    update_obj['sources'] = [
                        {'id': str(i), 'title': 'Source ' + str(i), 'url': c}
                        for i, c in enumerate(search_content.get('citations', []), 1)
                    ]
                tracker.notifier.add_notification(
                    title=f'{plan.topic} - 新しい更新',
                    message=diff.get('summary', '新しい情報が見つかりました'),
                    type='update',
                    plan_id=plan.id,
                    details=diff
                )

        plan.last_search_result = new_data
        plan.last_search_time = datetime.now()
        tracker.save_tracking_plans()
        return jsonify({'success': True, 'update': update_obj or new_data, 'message': 'Tracking update complete'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


NOTIFICATION_SETTINGS_FILE = 'burilar_notification_settings.json'
_DEFAULT_NOTIFICATION_SETTINGS = {
    'email_enabled': False,
    'push_enabled': False,
    'in_app_enabled': True,
    'quiet_hours_start': None,
    'quiet_hours_end': None,
    'digest_enabled': False,
    'digest_frequency': 'daily'
}


def _load_notification_settings():
    from backend.db import is_db_available, get_supabase
    if is_db_available():
        try:
            res = get_supabase().table('notification_settings').select('*').eq('id', 'global').execute()
            if res.data:
                row = res.data[0]
                row.pop('id', None)
                row.pop('updated_at', None)
                return row
        except Exception as e:
            print(f"[settings] DB load failed: {e}")
    # JSON fallback
    if os.path.exists(NOTIFICATION_SETTINGS_FILE):
        try:
            with open(NOTIFICATION_SETTINGS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return dict(_DEFAULT_NOTIFICATION_SETTINGS)


def _save_notification_settings(settings):
    from backend.db import is_db_available, get_supabase
    if is_db_available():
        try:
            payload = {k: v for k, v in settings.items() if k in _DEFAULT_NOTIFICATION_SETTINGS}
            payload['id'] = 'global'
            get_supabase().table('notification_settings').upsert(payload).execute()
            return
        except Exception as e:
            print(f"[settings] DB save failed: {e}")
    with open(NOTIFICATION_SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(settings, f, ensure_ascii=False, indent=2)


@app.route('/api/suggestions', methods=['GET'])
@auth_optional
def get_suggestions():
    """Return home page suggestions based on user's active trackings or curated defaults."""
    user = get_current_user()
    user_id = user['id'] if user else None

    _GRADIENTS = [
        'from-indigo-400 to-purple-500',
        'from-cyan-400 to-blue-500',
        'from-pink-400 to-rose-500',
        'from-amber-400 to-orange-500',
        'from-purple-400 to-pink-500',
        'from-green-400 to-emerald-500',
    ]
    _ICONS = ['📌', '🔍', '📊', '⚡', '🎯', '🚀']

    if user_id:
        user_plans = [
            p for p in tracker.tracking_plans.values()
            if p.user_id == user_id and p.active
        ]
    else:
        user_plans = []

    if user_plans:
        suggestions = []
        for i, plan in enumerate(user_plans[:6]):
            suggestions.append({
                'title': plan.topic,
                'description': plan.objective or plan.topic,
                'query': plan.original_query or plan.topic,
                'category': 'tracking',
                'icon': _ICONS[i % len(_ICONS)],
                'gradient': _GRADIENTS[i % len(_GRADIENTS)],
            })
        return jsonify(suggestions)

    return jsonify([
        {'title': 'Tesla Competitor Analysis', 'description': 'テスラの競合分析（EV・自動運転）', 'query': 'テスラの競合分析（EV・自動運転）', 'category': 'tech', 'icon': '🚗', 'gradient': 'from-red-500 to-red-700'},
        {'title': 'Apple Intelligence', 'description': '最新の動向と日本市場への影響', 'query': 'Apple Intelligenceの最新動向について', 'category': 'tech', 'icon': '🍎', 'gradient': 'from-gray-700 to-gray-900'},
        {'title': '最新AIモデル', 'description': '最新のLLMやマルチモーダルAIの動向', 'query': '最新のLLMやマルチモーダルAIの動向を教えて', 'category': 'ai', 'icon': '🤖', 'gradient': 'from-indigo-400 to-purple-500'},
        {'title': 'ビジネストレンド', 'description': '今年注目のビジネストレンドを分析', 'query': '今年注目のビジネストレンドを分析してほしい', 'category': 'business', 'icon': '📊', 'gradient': 'from-cyan-400 to-blue-500'},
        {'title': '量子コンピューティング', 'description': '量子コンピューティングの実用化状況', 'query': '量子コンピューティングの実用化最新状況', 'category': 'tech', 'icon': '⚡', 'gradient': 'from-amber-400 to-orange-500'},
        {'title': 'UIデザイントレンド', 'description': '2025年のウェブデザインのトレンド', 'query': '2025年のUIデザインのトレンドを教えて', 'category': 'design', 'icon': '🎨', 'gradient': 'from-purple-400 to-pink-500'},
    ])


@app.route('/api/notifications/settings/global', methods=['GET'])
def get_notification_settings():
    """Get global notification settings."""
    return jsonify(_load_notification_settings())


@app.route('/api/notifications/settings/global', methods=['PUT'])
def update_notification_settings():
    """Update global notification settings."""
    data = request.json or {}
    settings = _load_notification_settings()
    settings.update({k: v for k, v in data.items() if k in _DEFAULT_NOTIFICATION_SETTINGS})
    _save_notification_settings(settings)
    return jsonify(settings)


@app.route('/api/debug/notification', methods=['POST'])
def debug_notification():
    """Trigger a debug notification."""
    data = request.json
    tracker.notifier.add_notification(
        title=data.get('title', 'Test Notification'),
        message=data.get('message', 'This is a test notification for verification.'),
        type=data.get('type', 'info'),
        plan_id=data.get('plan_id'),
        details=data.get('details')
    )
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    # Use stat reloader instead of watchdog to avoid watching site-packages
    app.run(debug=True, port=5050, use_reloader=True, reloader_type='stat')