import sys
import os
import json

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.architect import TrackingArchitect

def test_architect():
    architect = TrackingArchitect()
    
    print("=== Testing TrackingArchitect ===\n")
    
    # Test Case 1: Release Watch (iPhone 16)
    print("--- Test 1: Release Watch (iPhone 16) ---")
    topic = "iPhone 16"
    intent = {"category": "release_watch"}
    search_result = """
    Latest rumors suggest iPhone 16 will release in September 2024. 
    Source: https://www.macrumors.com/roundup/iphone-16/ 
    According to 9to5mac.com, the pro models will have larger screens.
    Apple official site (apple.com) has not confirmed yet.
    """
    
    strategy = architect.generate_strategy(topic, intent, search_result)
    print(json.dumps(strategy, indent=2))
    print(f"Sources Found: {len(strategy['priority_sources'])}")
    print(f"Suggested Frequency: {strategy['frequency_hours']}h")
    print("-" * 50)

    # Test Case 2: Metric Tracking (Bitcoin)
    print("--- Test 2: Metric Tracking (Bitcoin) ---")
    topic = "Bitcoin Price"
    intent = {"category": "metric_tracking"}
    search_result = "Bitcoin price live on coindesk.com and coinmarketcap.com."
    
    strategy = architect.generate_strategy(topic, intent, search_result)
    print(json.dumps(strategy, indent=2))
    print(f"Suggested Frequency: {strategy['frequency_hours']}h (Expected: 6)")
    print("-" * 50)

if __name__ == "__main__":
    test_architect()
