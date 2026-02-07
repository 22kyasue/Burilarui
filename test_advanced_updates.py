import unittest
from unittest.mock import MagicMock, patch
import json
import os
from datetime import datetime, timedelta
from backend.core.tracker import BurilarTracker
from backend.models.tracking import TrackingPlan

class TestAdvancedUpdates(unittest.TestCase):
    def setUp(self):
        # Setup temporary test file
        self.test_data_file = "test_tracking_data.json"
        self.test_notif_file = "test_notifications.json"
        
        # Initialize Tracker with test files
        self.tracker = BurilarTracker()
        self.tracker.data_file = self.test_data_file
        self.tracker.notifier.data_file = self.test_notif_file
        self.tracker.notifier.notifications = []
        
        # Clean up previous runs
        if os.path.exists(self.test_data_file):
            os.remove(self.test_data_file)
        if os.path.exists(self.test_notif_file):
            os.remove(self.test_notif_file)

    def tearDown(self):
        # Cleanup
        if os.path.exists(self.test_data_file):
            os.remove(self.test_data_file)
        if os.path.exists(self.test_notif_file):
            os.remove(self.test_notif_file)

    def test_structured_update_generation(self):
        # 1. Create a dummy plan
        plan = TrackingPlan(
            topic="Test Topic",
            objective="Track changes",
            frequency_hours=1,
            keywords=[],
            status="tracking"
        )
        plan.id = "test_plan_1"
        plan.active = True
        plan.next_search_time = datetime.now() - timedelta(hours=1) # Due now
        plan.last_search_result = {
            "status": "released",
            "date": "2023-01-01",
            "latest_update_summary": "Initial release."
        }
        plan.strategy = {
            "schema_type": "release_watch",
            "search_queries": ["query 1"]
        }
        
        self.tracker.tracking_plans[plan.id] = plan
        
        # 2. Mock Executor to return new structured data
        # check_tracking_updates calls executor.execute_plan
        
        new_search_result = {
            "content": "The status is now deprecated. New version coming in 2024.",
            "citations": [
                "http://example.com/source1",
                "http://example.com/source2"
            ],
            "images": []
        }
        
        self.tracker.executor.execute_plan = MagicMock(return_value=new_search_result)
        
        # 3. Mock Extractor to return new structured data from content
        # check_tracking_updates calls extractor.extract_data
        
        extracted_data = {
            "status": "deprecated",
            "date": "2023-01-01", # unchanged
            "latest_update_summary": "Status changed to deprecated."
        }
        self.tracker.extractor.extract_data = MagicMock(return_value=extracted_data)
        
        # 4. Run check_tracking_updates
        updates = self.tracker.check_tracking_updates()
        
        # 5. Verify Updates Found
        self.assertTrue(len(updates) > 0, "Should find an update")
        print(f"Update Found: {updates[0]}")
        
        # 6. Verify Notification details
        # Read the notification file
        with open(self.test_notif_file, 'r') as f:
            notifs = json.load(f)
            
        self.assertEqual(len(notifs), 1)
        latest_notif = notifs[0]
        
        self.assertIn("details", latest_notif)
        details = latest_notif["details"]
        
        print(f"Details: {json.dumps(details, indent=2)}")
        
        # Verify Specifics
        self.assertIn("Status changed from released to deprecated", details["changes"])
        self.assertEqual(details["summary"], "Release information has been updated.")
        
        # Verify Sources
        self.assertEqual(len(details["sources"]), 2)
        self.assertEqual(details["sources"][0]["url"], "http://example.com/source1")
        self.assertEqual(details["sources"][0]["id"], "1")

if __name__ == '__main__':
    unittest.main()
