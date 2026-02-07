import time
import requests
import sys

# This script is intended to be run in the background while the browser subagent is active.
# It waits for a few seconds to let the browser load, then triggers a series of notifications.

BASE_URL = "http://localhost:5050"

def trigger_notifications():
    print("Background Trigger: Waiting 10s for browser...", flush=True)
    time.sleep(10)

    print("Background Trigger: Sending Toast Notification...", flush=True)
    try:
        requests.post(f"{BASE_URL}/api/debug/notification", json={
            "title": "Welcome to Burilar!",
            "message": "This is a test notification to verify the toast system.",
            "type": "info"
        })
    except Exception as e:
        print(f"Failed to trigger: {e}")

    time.sleep(5)
    
    print("Background Trigger: Sending Another Notification...", flush=True)
    try:
        requests.post(f"{BASE_URL}/api/debug/notification", json={
            "title": "Urgent Update",
            "message": "Something happened! Check the update panel.",
            "type": "warning"
        })
    except Exception as e:
        print(f"Failed to trigger: {e}")

if __name__ == "__main__":
    trigger_notifications()
