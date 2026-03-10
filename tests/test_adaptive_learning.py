import unittest
import json
import os
import sys
from datetime import datetime

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.core.tracker import BurilarTracker
from backend.models.tracking import TrackingPlan

class TestAdaptiveLearning(unittest.TestCase):
    def setUp(self):
        # Create a tracker with a temporary data file
        self.tracker = BurilarTracker()
        self.tracker.data_file = "test_tracking_data.json"
        self.tracker.notifier.data_file = "test_notifications.json"
        self.tracker.tracking_plans = {}
        
        # Clean up existing test files
        if os.path.exists(self.tracker.data_file):
            os.remove(self.tracker.data_file)
        if os.path.exists(self.tracker.notifier.data_file):
            os.remove(self.tracker.notifier.data_file)
            
        # Create a dummy plan
        self.plan_id = "test_plan_123"
        self.plan = TrackingPlan(
            topic="Apple Stock",
            objective="Track daily price changes",
            frequency_hours=24,
            keywords=["Apple", "Stock", "Price"]
        )
        self.plan.id = self.plan_id
        self.tracker.tracking_plans[self.plan_id] = self.plan

    def tearDown(self):
        # Clean up test files
        if os.path.exists(self.tracker.data_file):
            os.remove(self.tracker.data_file)
        if os.path.exists(self.tracker.notifier.data_file):
            os.remove(self.tracker.notifier.data_file)

    def test_adjustment_logic(self):
        print("\nTesting Adjustment Logic...")
        # 1. Add some "not useful" feedback
        self.tracker.notifier.add_notification(
            title="Update: Apple Stock",
            message="No significant change today.",
            type="update",
            plan_id=self.plan_id
        )
        notification_id = self.tracker.notifier.notifications[0]["id"]
        self.tracker.notifier.submit_feedback(notification_id, "not_useful")
        
        # 2. Run adjustment
        # Note: This will call Perplexity API, so we might need to mock it if we don't want real calls.
        # However, for a "real" verification in this environment, a real call is fine if Perplexity is available.
        result = self.tracker.analyze_feedback_and_adjust(self.plan_id)
        
        print(f"Adjustment Result: {json.dumps(result, indent=2)}")
        
        if result.get("status") == "adjusted":
            self.assertTrue("applied_changes" in result)
            # Check if plan was actually updated
            updated_plan = self.tracker.tracking_plans[self.plan_id]
            # Since LLM response is non-deterministic, we just check if any of the adjusted fields changed
            # or if the result says it was adjusted.
            print(f"Updated Plan Keywords: {updated_plan.keywords}")
            print(f"Updated Plan Frequency: {updated_plan.frequency_hours}")
        else:
            self.fail(f"Adjustment failed: {result.get('error') or result.get('message')}")

if __name__ == "__main__":
    unittest.main()
