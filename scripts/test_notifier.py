import sys
import os
import json
import time

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.notifier import NotificationManager

def test_notifier():
    print("=== Testing Notification Manager ===\n")
    
    # Use a test file
    test_file = "test_notifications.json"
    if os.path.exists(test_file):
        os.remove(test_file)
        
    notifier = NotificationManager(data_file=test_file)
    
    # 1. Add Notification
    print("--- Step 1: Add Notification ---")
    n1 = notifier.add_notification(
        title="Test Update",
        message="This is a test notification.",
        type="info"
    )
    print(f"Added: {n1['id']} - {n1['title']}")
    
    # Verify file content
    with open(test_file, 'r') as f:
        data = json.load(f)
        if len(data) == 1 and data[0]['id'] == n1['id']:
            print("[SUCCESS] Notification stored in file.")
        else:
            print("[FAIL] File storage mismatch.")
            
    # 2. Get Unread
    print("\n--- Step 2: Get Unread ---")
    unread = notifier.get_notifications(unread_only=True)
    print(f"Unread count: {len(unread)}")
    if len(unread) == 1:
        print("[SUCCESS] Retrieve unread works.")
    else:
        print("[FAIL] Retrieve unread failed.")
        
    # 3. Mark as Read
    print("\n--- Step 3: Mark as Read ---")
    notifier.mark_as_read(n1['id'])
    
    unread_after = notifier.get_notifications(unread_only=True)
    print(f"Unread count after mark: {len(unread_after)}")
    
    if len(unread_after) == 0:
        print("[SUCCESS] Mark as read works.")
    else:
        print("[FAIL] Mark as read failed.")
        
    # Cleanup
    if os.path.exists(test_file):
        os.remove(test_file)
        print("\nTest file cleaned up.")

if __name__ == "__main__":
    test_notifier()
