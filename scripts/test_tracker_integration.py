import sys
import os
import json

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.tracker import BurilarTracker

def test_integration():
    print("=== Testing BurilarTracker Integration ===\n")
    tracker = BurilarTracker()
    
    # Test Case: Real Query
    query = "Google Pixel 9 release date"
    print(f"Query: {query}")
    
    # Simulate an initial search result (normally passed from frontend/API)
    mock_search_result = """
    Rumors suggest Google Pixel 9 will launch in October 2024.
    Sources: https://www.androidauthority.com/pixel-9, https://9to5google.com/guides/pixel-9/.
    """
    
    print("Generating Plan... (Calling LLMs)")
    plan = tracker.generate_tracking_plan(query, mock_search_result)
    
    print("\n--- Generated Plan ---")
    print(f"Topic: {plan.topic}")
    print(f"Objective: {plan.objective}")
    print(f"Frequency: {plan.frequency_hours}h")
    print(f"Strategy Present: {bool(plan.strategy)}")
    
    if plan.strategy:
        print("\n--- Strategy Details ---")
        print(json.dumps(plan.strategy, indent=2))
        
        # Verification
        if "androidauthority.com" in plan.strategy.get("priority_sources", []):
            print("\n[SUCCESS] Source Discovery worked!")
        else:
            print("\n[INFO] Source Discovery check (might vary based on extraction)")
            
        if plan.strategy.get("frequency_hours") == 12: # Release watch default
             print("[SUCCESS] correct frequency for release_watch")

if __name__ == "__main__":
    test_integration()
