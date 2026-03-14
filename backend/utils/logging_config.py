"""
Structured Logging Configuration
Sets up JSON-formatted logging with request tracing.
"""

import logging
import time
import uuid

from flask import g, request


def setup_logging(app):
    """Configure structured logging for the Flask app."""
    log_level = app.config.get('LOG_LEVEL', 'INFO')

    # Configure root logger
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s %(name)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level, logging.INFO))
    root_logger.handlers = [handler]

    logger = logging.getLogger('burilar.request')

    @app.before_request
    def before_request():
        g.request_id = uuid.uuid4().hex[:8]
        g.request_start = time.time()

    @app.after_request
    def after_request(response):
        # Skip static file requests
        if request.path.startswith('/assets/') or request.path.endswith(('.js', '.css', '.ico', '.png', '.jpg')):
            return response

        duration_ms = round((time.time() - getattr(g, 'request_start', time.time())) * 1000)
        user_id = getattr(g, 'current_user', {}).get('id', '-') if hasattr(g, 'current_user') and g.current_user else '-'

        logger.info(
            '%s %s %s user=%s %dms',
            g.get('request_id', '-'),
            request.method,
            request.path,
            user_id,
            duration_ms,
        )

        return response
