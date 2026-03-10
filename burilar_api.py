"""
Burilar API Backend
App setup, blueprint registration, and background scheduler.
"""

import os
import threading
import time

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, send_from_directory
from flask_cors import CORS
from backend.core.tracker import BurilarTracker

# App setup
app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app)

# Tracker singleton — shared with blueprints via app.config
tracker = BurilarTracker.get_instance()
app.config['tracker'] = tracker

# Register blueprints
from backend.routes import auth_bp, chats_bp, trackings_bp, notifications_bp, search_bp
app.register_blueprint(auth_bp)
app.register_blueprint(chats_bp)
app.register_blueprint(trackings_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(search_bp)


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


# Background scheduler
def background_checker():
    """Periodically check all active trackings for updates."""
    while True:
        time.sleep(300)  # Check every 5 minutes
        try:
            tracker.check_all_updates()
        except Exception as e:
            print(f"Background check error: {e}")


threading.Thread(target=background_checker, daemon=True).start()


if __name__ == '__main__':
    app.run(debug=True, port=5050, use_reloader=True, reloader_type='stat')
