import json
import os
import time
from typing import List, Dict, Optional
from datetime import datetime

class NotificationManager:
    """
    Manages user notifications.
    Stores notifications in a local JSON file for now.
    """
    def __init__(self, data_file: str = "burilar_notifications.json"):
        self.data_file = data_file
        self.notifications: List[Dict] = []
        self._load_notifications()
        
    def _load_notifications(self):
        """Load notifications from file."""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    self.notifications = json.load(f)
            except Exception as e:
                print(f"Error loading notifications: {str(e)}")
                self.notifications = []
        else:
            self.notifications = []
            
    def _save_notifications(self):
        """Save notifications to file."""
        try:
            with open(self.data_file, 'w') as f:
                json.dump(self.notifications, f, indent=2)
        except Exception as e:
            print(f"Error saving notifications: {str(e)}")
            
    def add_notification(self, title: str, message: str, type: str = "info", link: str = None, plan_id: str = None, details: Dict = None):
        """Add a new notification."""
        notification = {
            "id": str(int(time.time() * 1000)),
            "timestamp": datetime.now().isoformat(),
            "title": title,
            "message": message,
            "type": type, # info, success, warning, error, update
            "link": link,
            "plan_id": plan_id,
            "read": False,
            "details": details # Store rich details
        }
        self.notifications.insert(0, notification) # Add to top
        self._save_notifications()
        return notification
        
    def get_notifications(self, unread_only: bool = False, limit: int = 50) -> List[Dict]:
        """Get notifications."""
        if unread_only:
            return [n for n in self.notifications if not n.get("read", False)][:limit]
        return self.notifications[:limit]
        
    def mark_as_read(self, notification_id: str):
        """Mark a notification as read."""
        for n in self.notifications:
            if n["id"] == notification_id:
                n["read"] = True
                self._save_notifications()
                return True
        return False

    def submit_feedback(self, notification_id: str, feedback_type: str):
        """Submit feedback for a notification."""
        for n in self.notifications:
            if n["id"] == notification_id:
                n["feedback"] = feedback_type
                self._save_notifications()
                return True
        return False
        
    def mark_all_as_read(self):
        """Mark all notifications as read."""
        for n in self.notifications:
            n["read"] = True
        self._save_notifications()
