import requests
import time
import json

BASE_URL = "http://localhost:5050"

def test_feedback():
    print("Testing Feedback API...")
    
    # 1. Create a notification (using internal method or via a trigger script if available)
    # Since we don't have a direct API to creating notifications exposed publicly easily without auth, 
    # we can try to use the notifier service directly if this was a unit test. 
    # But as an integration test, we can assume there might be some notifications or we can trigger one.
    # Actually, we can use the `notifier.add_notification` if we run this as a script importing the module,
    # or just manually check existing ones.
    
    # Let's try to fetch notifications first.
    print("Fetching notifications...")
    try:
        response = requests.get(f"{BASE_URL}/notifications")
        notifications = response.json()
    except requests.exceptions.ConnectionError:
        print("Error: Backend is not running on port 5050. Please start it.")
        return

    if not notifications:
        print("No notifications found. Cannot test feedback.")
        # We could try to trigger one if we had a trigger endpoint.
        # Let's just create a mock one via python shell if needed, but for now just reporting.
        return

    target_id = notifications[0]['id']
    print(f"Targeting notification ID: {target_id}")

    # 2. Submit Feedback
    print("Submitting 'useful' feedback...")
    response = requests.post(f"{BASE_URL}/api/notifications/{target_id}/feedback", json={"feedback": "useful"})
    
    if response.status_code == 200:
        print("Feedback submitted successfully.")
    else:
        print(f"Failed to submit feedback: {response.text}")
        return

    # 3. Verify Feedback is stored
    print("Verifying feedback storage...")
    response = requests.get(f"{BASE_URL}/notifications")
    notifications = response.json()
    
    target_notification = next((n for n in notifications if n['id'] == target_id), None)
    
    if target_notification and target_notification.get('feedback') == 'useful':
        print("SUCCESS: Feedback 'useful' confirmed in storage.")
    else:
        print(f"FAILURE: Feedback not found or incorrect. Data: {target_notification}")

if __name__ == "__main__":
    test_feedback()
