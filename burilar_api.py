"""
Burilar API Backend
App setup, blueprint registration, and background scheduler.
"""

import os

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import HTTPException
from flask_cors import CORS
from backend.core.tracker import BurilarTracker
from backend.extensions import limiter
from backend.utils.logging_config import setup_logging

# App setup
app = Flask(__name__, static_folder='build', static_url_path='')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB request limit

# CORS — restrict to frontend origin in production
CORS(app, origins=os.getenv('CORS_ORIGINS', '*').split(','))

# Rate limiter
limiter.init_app(app)

# Structured logging
setup_logging(app)

# 429 error handler
@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        'error': {
            'code': 'RATE_LIMITED',
            'message': 'リクエスト数の上限に達しました。しばらくしてからお試しください。',
        }
    }), 429

import logging
logger = logging.getLogger(__name__)

# SPA fallback for client-side routes (e.g. /home) — must be registered
# before the catch-all Exception handler so 404s on non-API GETs serve index.html.
@app.errorhandler(404)
def spa_fallback(e):
    # Only fall back to the SPA for non-API GET requests; API misses stay 404.
    if request.method == 'GET' and not request.path.startswith('/api/'):
        return send_from_directory(app.static_folder, 'index.html')
    return jsonify({
        'error': {
            'code': 'NOT_FOUND',
            'message': 'リソースが見つかりません。',
        }
    }), 404


# Global 500 handler — catch unhandled exceptions, but let HTTPExceptions
# (404, 429, etc.) flow through to their dedicated handlers.
@app.errorhandler(Exception)
def handle_unhandled_exception(e):
    if isinstance(e, HTTPException):
        return e
    logger.exception('Unhandled exception: %s', e)
    return jsonify({
        'error': {
            'code': 'INTERNAL_ERROR',
            'message': 'サーバー内部エラーが発生しました。',
        }
    }), 500

# Tracker singleton — shared with blueprints via app.config
tracker = BurilarTracker.get_instance()
app.config['tracker'] = tracker

# Register blueprints
from backend.routes import auth_bp, chats_bp, trackings_bp, notifications_bp, search_bp, errors_bp, billing_bp
app.register_blueprint(auth_bp)
app.register_blueprint(chats_bp)
app.register_blueprint(trackings_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(search_bp)
app.register_blueprint(errors_bp)
app.register_blueprint(billing_bp)


# SPA fallback
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


# Background scheduler (APScheduler)
from backend.scheduler import start_scheduler
start_scheduler(app)


if __name__ == '__main__':
    app.run(debug=True, port=5050, use_reloader=True, reloader_type='stat')
