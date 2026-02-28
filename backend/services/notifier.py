import json
import os
import time
from typing import List, Dict, Optional
from datetime import datetime
from backend.db import is_db_available, get_supabase


class NotificationManager:
    """
    Manages user notifications.
    Uses Supabase when available, falls back to JSON file for local dev.
    """

    def __init__(self, data_file: str = "burilar_notifications.json"):
        self.data_file = data_file
        self._use_db = is_db_available()
        # In-memory list used ONLY for JSON fallback mode
        self.notifications: List[Dict] = []
        if not self._use_db:
            self._load_notifications()

    # ------------------------------------------------------------------
    # JSON fallback helpers (local dev only)
    # ------------------------------------------------------------------

    def _load_notifications(self):
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, "r") as f:
                    self.notifications = json.load(f)
            except Exception as e:
                print(f"Error loading notifications: {e}")
                self.notifications = []
        else:
            self.notifications = []

    def _save_notifications(self):
        try:
            with open(self.data_file, "w") as f:
                json.dump(self.notifications, f, indent=2)
        except Exception as e:
            print(f"Error saving notifications: {e}")

    # ------------------------------------------------------------------
    # Public API (same interface regardless of backend)
    # ------------------------------------------------------------------

    def add_notification(self, title: str, message: str, type: str = "info",
                         link: str = None, plan_id: str = None, details: Dict = None):
        notification = {
            "id": str(int(time.time() * 1000)),
            "timestamp": datetime.now().isoformat(),
            "title": title,
            "message": message,
            "type": type,
            "link": link,
            "plan_id": plan_id,
            "read": False,
            "feedback": None,
            "details": details,
        }

        if self._use_db:
            try:
                res = get_supabase().table("notifications").insert(notification).execute()
                return res.data[0] if res.data else notification
            except Exception as e:
                print(f"[notifier] DB insert failed: {e}")
                return notification

        self.notifications.insert(0, notification)
        self._save_notifications()
        return notification

    def get_notifications(self, unread_only: bool = False, limit: int = 50) -> List[Dict]:
        if self._use_db:
            try:
                q = get_supabase().table("notifications").select("*").order("timestamp", desc=True).limit(limit)
                if unread_only:
                    q = q.eq("read", False)
                res = q.execute()
                return res.data or []
            except Exception as e:
                print(f"[notifier] DB query failed: {e}")
                return []

        items = self.notifications if not unread_only else [n for n in self.notifications if not n.get("read")]
        return items[:limit]

    def mark_as_read(self, notification_id: str) -> bool:
        if self._use_db:
            try:
                res = get_supabase().table("notifications").update({"read": True}).eq("id", notification_id).execute()
                return bool(res.data)
            except Exception as e:
                print(f"[notifier] mark_as_read failed: {e}")
                return False

        for n in self.notifications:
            if n["id"] == notification_id:
                n["read"] = True
                self._save_notifications()
                return True
        return False

    def submit_feedback(self, notification_id: str, feedback_type: str) -> bool:
        if self._use_db:
            try:
                res = get_supabase().table("notifications").update({"feedback": feedback_type}).eq("id", notification_id).execute()
                return bool(res.data)
            except Exception as e:
                print(f"[notifier] submit_feedback failed: {e}")
                return False

        for n in self.notifications:
            if n["id"] == notification_id:
                n["feedback"] = feedback_type
                self._save_notifications()
                return True
        return False

    def mark_all_as_read(self):
        if self._use_db:
            try:
                get_supabase().table("notifications").update({"read": True}).eq("read", False).execute()
                return
            except Exception as e:
                print(f"[notifier] mark_all_as_read failed: {e}")
                return

        for n in self.notifications:
            n["read"] = True
        self._save_notifications()

    def get_notification_by_id(self, notification_id: str) -> Optional[Dict]:
        """Helper used by the feedback endpoint to look up plan_id."""
        if self._use_db:
            try:
                res = get_supabase().table("notifications").select("*").eq("id", notification_id).execute()
                return res.data[0] if res.data else None
            except Exception as e:
                print(f"[notifier] get_notification_by_id failed: {e}")
                return None

        return next((n for n in self.notifications if n["id"] == notification_id), None)
