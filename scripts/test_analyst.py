import sys
import os
import json
from dataclasses import dataclass

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.executor import TrackingExecutor
from backend.services.extractor import InformationExtractor

# Mock Plan Class for testing
@dataclass
class MockPlan:
    topic: str
    strategy: dict

def test_analyst():
    print("=== Testing The Analyst (Executor & Extractor) ===\n")
    executor = TrackingExecutor()
    extractor = InformationExtractor()

    # Test Case 1: Release Watch (Pixel 9 - already ran, so simulating text)
    print("--- Test 1: Extraction Logic (Simulated Text) ---")
    raw_text = """
    Latest news confirms Google Pixel 9 was released in October 2024.
    Sources indicate it is available now.
    """
    print(f"Input Text: {raw_text.strip()}")
    
    extracted_data = extractor.extract_data(raw_text, "release_watch")
    print("\nExtracted Data:")
    print(json.dumps(extracted_data, indent=2))
    print("-" * 50)
    
    # Test Case 2: Metric Tracking (Simulated)
    print("--- Test 2: Metric Extraction ---")
    raw_text = """
    Search Result:
    Bitcoin (BTC) current price is $95,123.45 USD.
    Market cap is $1.8T.
    The trend has been bullish over the last 24 hours.
    Source: https://coinmarketcap.com_currencies_bitcoin
    """
    print(f"Input Text: {raw_text.strip()}")
    
    extracted_data = extractor.extract_data(raw_text, "metric_tracking")
    print("\nExtracted Data:")
    print(json.dumps(extracted_data, indent=2))
    print("-" * 50)
    
    # Test Case 3: Full Execution (Live Search)
    print("--- Test 3: Executor + Extractor (Live) ---")
    # Using a known topic
    plan = MockPlan(
        topic="Python 3.13 release schedule",
        strategy={
            "search_queries": ["Python 3.13 release date schedule"]
        }
    )
    
    print("Executing Search...")
    search_result = executor.execute_plan(plan)
    print(f"Search Result Length: {len(search_result)} chars")
    
    print("Extracting Data...")
    extracted_data = extractor.extract_data(search_result, "release_watch")
    print("\nExtracted Data:")
    print(json.dumps(extracted_data, indent=2))

if __name__ == "__main__":
    test_analyst()
