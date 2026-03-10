"""
API Integration Test Script
Tests the full flow against a running server: auth -> search -> tracking -> notifications.

Usage: python3 scripts/test_api.py [base_url]
Default base_url: http://localhost:5050
"""

import sys
import json
import time
import requests

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5050"
API = f"{BASE_URL}/api"

# Test state
token = None
user_id = None
tracking_id = None
notification_id = None

PASS = 0
FAIL = 0


def test(name, response, expected_status=None, check=None):
    """Helper to validate a response."""
    global PASS, FAIL
    ok = True
    details = []

    if expected_status and response.status_code != expected_status:
        ok = False
        details.append(f"expected {expected_status}, got {response.status_code}")

    if check:
        try:
            data = response.json()
            result = check(data)
            if result is False:
                ok = False
                details.append("check function returned False")
        except Exception as e:
            ok = False
            details.append(f"check error: {e}")

    status = "PASS" if ok else "FAIL"
    if ok:
        PASS += 1
    else:
        FAIL += 1

    detail_str = f" ({'; '.join(details)})" if details else ""
    print(f"  [{status}] {name}{detail_str}")

    if not ok:
        try:
            print(f"         Response: {response.status_code} {response.text[:200]}")
        except Exception:
            pass

    return ok


def headers():
    """Auth headers."""
    if token:
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    return {"Content-Type": "application/json"}


def run_tests():
    global token, user_id, tracking_id, notification_id

    print(f"\n=== Burilar API Tests ({API}) ===\n")

    # ------------------------------------------------------------------
    # 1. Auth
    # ------------------------------------------------------------------
    print("1. Authentication")

    test_email = f"test_{int(time.time())}@example.com"
    test_password = "testpass123"
    test_name = "Test User"

    # Register
    r = requests.post(f"{API}/auth/register", json={
        "email": test_email, "password": test_password, "name": test_name
    })
    test("Register new user", r, 201,
         lambda d: d.get("accessToken") and d.get("user", {}).get("email") == test_email)

    if r.status_code == 201:
        data = r.json()
        token = data["accessToken"]
        user_id = data["user"]["id"]

    # Login
    r = requests.post(f"{API}/auth/login", json={
        "email": test_email, "password": test_password
    })
    test("Login", r, 200, lambda d: d.get("accessToken"))

    # Get me
    r = requests.get(f"{API}/auth/me", headers=headers())
    test("Get current user", r, 200, lambda d: d.get("email") == test_email)

    # ------------------------------------------------------------------
    # 2. Auth required (401 tests)
    # ------------------------------------------------------------------
    print("\n2. Auth Required (expect 401)")

    r = requests.get(f"{API}/trackings")
    test("List trackings without auth -> 401", r, 401)

    r = requests.get(f"{API}/notifications")
    test("List notifications without auth -> 401", r, 401)

    r = requests.post(f"{API}/search", json={"query": "test"})
    test("Search without auth -> 401", r, 401)

    # ------------------------------------------------------------------
    # 3. Search
    # ------------------------------------------------------------------
    print("\n3. Search")

    r = requests.post(f"{API}/search", json={"query": ""}, headers=headers())
    test("Empty query -> 400", r, 400)

    r = requests.post(f"{API}/search",
                      json={"query": "Python 3.15 release date"},
                      headers=headers())
    test("Search with valid query", r, 200,
         lambda d: "resolvedQuery" in d and "needsClarification" in d)

    search_content = None
    if r.status_code == 200:
        data = r.json()
        search_content = data.get("content")
        status = data.get("status")
        print(f"         Search status: {status}, content length: {len(search_content or '')}")

    # ------------------------------------------------------------------
    # 4. Trackings CRUD
    # ------------------------------------------------------------------
    print("\n4. Trackings")

    # Create
    r = requests.post(f"{API}/trackings", json={"query": ""}, headers=headers())
    test("Create tracking with empty query -> 400", r, 400)

    r = requests.post(f"{API}/trackings", json={
        "query": "Python 3.15 release date",
        "searchResult": search_content,
        "frequency": "daily",
        "notificationEnabled": True,
    }, headers=headers())
    test("Create tracking", r, 201,
         lambda d: d.get("tracking", {}).get("id"))

    if r.status_code == 201:
        tracking_id = r.json()["tracking"]["id"]
        print(f"         Tracking ID: {tracking_id}")

    # List
    r = requests.get(f"{API}/trackings", headers=headers())
    test("List trackings", r, 200,
         lambda d: isinstance(d.get("trackings"), list) and len(d["trackings"]) >= 1)

    # Get detail
    if tracking_id:
        r = requests.get(f"{API}/trackings/{tracking_id}", headers=headers())
        test("Get tracking detail", r, 200,
             lambda d: d.get("tracking", {}).get("id") == tracking_id and "updates" in d.get("tracking", {}))

    # Update (PATCH)
    if tracking_id:
        r = requests.patch(f"{API}/trackings/{tracking_id}",
                           json={"isPinned": True, "frequency": "weekly"},
                           headers=headers())
        test("Update tracking settings", r, 200,
             lambda d: d.get("tracking", {}).get("isPinned") is True)

    # Get non-existent
    r = requests.get(f"{API}/trackings/nonexistent", headers=headers())
    test("Get non-existent tracking -> 404", r, 404)

    # ------------------------------------------------------------------
    # 5. Execution
    # ------------------------------------------------------------------
    print("\n5. Execution")

    if tracking_id:
        r = requests.post(f"{API}/trackings/{tracking_id}/execute", headers=headers())
        test("Execute tracking (manual refresh)", r, 200,
             lambda d: "update" in d or "message" in d)

    # ------------------------------------------------------------------
    # 6. Updates
    # ------------------------------------------------------------------
    print("\n6. Updates")

    if tracking_id:
        r = requests.get(f"{API}/trackings/{tracking_id}/updates?page=1&pageSize=10",
                         headers=headers())
        test("Get tracking updates (paginated)", r, 200,
             lambda d: "updates" in d and "total" in d)

        # Mark all read
        r = requests.post(f"{API}/trackings/{tracking_id}/updates/read-all",
                          headers=headers())
        test("Mark all updates read", r, 200,
             lambda d: d.get("success") is True)

    # ------------------------------------------------------------------
    # 7. Notifications
    # ------------------------------------------------------------------
    print("\n7. Notifications")

    r = requests.get(f"{API}/notifications", headers=headers())
    test("List notifications", r, 200,
         lambda d: "notifications" in d and "unreadCount" in d)

    if r.status_code == 200:
        notifications = r.json().get("notifications", [])
        if notifications:
            notification_id = notifications[0]["id"]

    r = requests.get(f"{API}/notifications/unread-count", headers=headers())
    test("Get unread count", r, 200, lambda d: "count" in d)

    if notification_id:
        # Mark read
        r = requests.patch(f"{API}/notifications/{notification_id}/read",
                           headers=headers())
        test("Mark notification read", r, 200, lambda d: d.get("success") is True)

        # Submit feedback
        r = requests.post(f"{API}/notifications/{notification_id}/feedback",
                          json={"feedback": "useful"}, headers=headers())
        test("Submit notification feedback", r, 200, lambda d: d.get("success") is True)

        # Invalid feedback
        r = requests.post(f"{API}/notifications/{notification_id}/feedback",
                          json={"feedback": "invalid"}, headers=headers())
        test("Invalid feedback -> 400", r, 400)

    # Mark all read
    r = requests.post(f"{API}/notifications/mark-all-read", headers=headers())
    test("Mark all notifications read", r, 200, lambda d: d.get("success") is True)

    # ------------------------------------------------------------------
    # 8. Cleanup
    # ------------------------------------------------------------------
    print("\n8. Cleanup")

    if notification_id:
        r = requests.delete(f"{API}/notifications/{notification_id}", headers=headers())
        test("Delete notification", r, 204)

    if tracking_id:
        r = requests.delete(f"{API}/trackings/{tracking_id}", headers=headers())
        test("Delete tracking", r, 204)

        # Verify deleted
        r = requests.get(f"{API}/trackings/{tracking_id}", headers=headers())
        test("Verify tracking deleted -> 404", r, 404)

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    print(f"\n{'='*40}")
    print(f"Results: {PASS} passed, {FAIL} failed, {PASS + FAIL} total")
    print(f"{'='*40}\n")

    return FAIL == 0


if __name__ == "__main__":
    try:
        # Quick connectivity check
        requests.get(BASE_URL, timeout=3)
    except requests.exceptions.ConnectionError:
        print(f"ERROR: Cannot connect to {BASE_URL}")
        print("Make sure the server is running: python3 burilar_api.py")
        sys.exit(1)

    success = run_tests()
    sys.exit(0 if success else 1)
