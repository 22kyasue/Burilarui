"""
Background Scheduler
Replaces bare threading.Thread with APScheduler for reliable background tasks.
"""

import atexit
import logging
import os

from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(
    job_defaults={
        'coalesce': True,       # Merge missed runs into one
        'max_instances': 1,     # Prevent overlapping runs
        'misfire_grace_time': 300,  # 5-min grace period
    }
)


def _check_updates(app):
    """Run update check within Flask app context."""
    with app.app_context():
        try:
            tracker = app.config.get('tracker')
            if tracker:
                results = tracker.check_all_updates()
                if results:
                    logger.info("Background check found %d updates", len(results))
        except Exception as e:
            logger.error("Background check error: %s", e)


def _cleanup_usage():
    """Clean up stale daily usage counters."""
    from backend.billing.usage import cleanup_old_usage
    try:
        cleanup_old_usage()
    except Exception as e:
        logger.error("Usage cleanup error: %s", e)


def start_scheduler(app):
    """Start the background scheduler with the Flask app."""
    # Avoid double-start when Flask reloader is active
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or not app.debug:
        scheduler.add_job(
            _check_updates,
            'interval',
            minutes=5,
            args=[app],
            id='check_all_updates',
            replace_existing=True,
        )
        scheduler.add_job(
            _cleanup_usage,
            'cron',
            hour=0,
            minute=5,
            id='cleanup_usage',
            replace_existing=True,
        )
        scheduler.start()
        atexit.register(lambda: scheduler.shutdown(wait=False))
        logger.info("Background scheduler started (5-min interval)")
