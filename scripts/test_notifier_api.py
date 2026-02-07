import sys
import os
import json
import time

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from burilar_api import app, tracker

def test_api():
    print("=== Testing Notification API ===\n")
    
    # Use test client
    client = app.test_client()
    
    # 1. Inject Notification
    print("--- Step 1: Inject Notification ---")
    n1 = tracker.notifier.add_notification(
        title="API Test",
        message="Running API test.",
        type="info"
    )
    print(f"Injected: {n1['id']}")
    
    # 2. Get Notifications (Unread)
    print("\n--- Step 2: GET /notifications?unread_only=true ---")
    response = client.get('/notifications?unread_only=true')
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = json.loads(response.data)
        print(f"Count: {len(data)}")
        
        found = False
        for n in data:
            if n['id'] == n1['id']:
                found = True
                break
        
        if found:
            print("[SUCCESS] Found injected notification via API.")
        else:
            print("[FAIL] Notification not found in API response.")
    else:
        print("[FAIL] API call failed.")
        
    # 3. Mark as Read
    print("\n--- Step 3: POST /notifications/read ---")
    response = client.post('/notifications/read', json={'id': n1['id']})
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.data}")
    
    if response.status_code == 200:
        print("[SUCCESS] Marked as read via API.")
    else:
        print("[FAIL] Mark as read failed.")
        
    # 4. Verify Unread Count
    print("\n--- Step 4: Verify Gone from Unread ---")
    response = client.get('/notifications?unread_only=true')
    data = json.loads(response.data)
    
    found = False
    for n in data:
        if n['id'] == n1['id']:
            found = True
            break
            
    if not found:
        print("[SUCCESS] Notification no longer in unread list.")
    else:
        print("[FAIL] Notification still in unread list.")

if __name__ == "__main__":
    test_api()
