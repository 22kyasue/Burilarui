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
            'image_url': plan.image_url
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
    if success:
        return jsonify({"status": "success"})
    return jsonify({"error": "Notification not found"}), 404

@app.route('/api/debug/notification', methods=['POST'])
def debug_notification():
    """Trigger a debug notification."""
    data = request.json
    tracker.notifier.add_notification(
        title=data.get('title', 'Test Notification'),
        message=data.get('message', 'This is a test notification for verification.'),
        type=data.get('type', 'info'),
        details=data.get('details') # Support rich details
    )
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    # Use stat reloader instead of watchdog to avoid watching site-packages
    app.run(debug=True, port=5050, use_reloader=True, reloader_type='stat')