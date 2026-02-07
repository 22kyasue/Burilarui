import sys
import os
import time
import json
from datetime import datetime, timedelta

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.tracker import BurilarTracker

def test_full_flow():
    print("=== Testing Full Analyst Flow Integration ===\n")
    tracker = BurilarTracker()
    
    # 1. Generate Plan
    print("--- Step 1: Generate Plan ---")
    query = "Python 3.14 release date"
    print(f"Query: {query}")
    mock_search = "Python 3.14 is expected in October 2025."
    
    plan = tracker.generate_tracking_plan(query, mock_search)
    print(f"Plan Created: {plan.topic} (Frequency: {plan.frequency_hours}h)")
    
    # 2. Start Tracking (Initial Execution)
    print("\n--- Step 2: Start Tracking (Initial Execution) ---")
    print("Executing initial search & extraction...")
    tracker.start_tracking(plan)
    
    print("Initial Result Stored:")
    print(json.dumps(plan.last_search_result, indent=2))
    
    # 3. Force Update Check
    print("\n--- Step 3: Check for Updates (Force) ---")
    # Fast-forward time
    plan.next_search_time = datetime.now() - timedelta(hours=1)
    
    print("Checking for updates...")
    updates = tracker.check_tracking_updates()
    
    if updates:
        print("\n[SUCCESS] Updates found!")
        print(f"Update: {updates[0]['update']}")
        print("New Data Snapshot:")
        print(json.dumps(updates[0]['data'] if 'data' in updates[0] else {}, indent=2))
    else:
        print("\n[INFO] No updates found (expected if live data hasn't changed in 1 second)")
        # This confirms the check ran without error
        print("Check ran successfully.")

if __name__ == "__main__":
    test_full_flow()
