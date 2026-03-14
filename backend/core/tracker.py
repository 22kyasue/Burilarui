"""
BurilarTracker — Core Orchestrator
Thin singleton that coordinates services and storage. No file I/O.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

from backend.storage import tracking_storage
from backend.services.perplexity import call_perplexity
from backend.services.analyzer import TrackingAnalyzer
from backend.services.architect import TrackingArchitect
from backend.services.executor import TrackingExecutor
from backend.services.extractor import InformationExtractor
from backend.services.notifier import NotificationService
from backend.services.differ import UpdateDiffer


def _hours_to_frequency(hours: int) -> tuple:
    """Convert frequency_hours to (frequency_name, custom_hours)."""
    if hours <= 1:
        return ('hourly', None)
    elif hours <= 24:
        return ('daily', None)
    elif hours <= 168:
        return ('weekly', None)
    else:
        return ('custom', hours)


def _frequency_to_hours(frequency: str, custom_hours: Optional[int] = None) -> int:
    """Convert named frequency to hours."""
    mapping = {'realtime': 0.5, 'hourly': 1, 'daily': 24, 'weekly': 168}
    if frequency == 'custom' and custom_hours:
        return custom_hours
    return mapping.get(frequency, 24)


class BurilarTracker:
    """
    Core orchestrator for the Burilar tracking system.
    Coordinates Analyzer, Architect, Executor, Extractor, Differ, and Notifier.
    """
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.analyzer = TrackingAnalyzer()
        self.architect = TrackingArchitect()
        self.executor = TrackingExecutor()
        self.extractor = InformationExtractor()
        self.notifier = NotificationService()
        self.differ = UpdateDiffer()

    # ------------------------------------------------------------------
    # Query Processing
    # ------------------------------------------------------------------

    def process_query(self, raw_query: str, chat_history: Optional[List[Dict]] = None) -> Dict:
        """
        Orchestrate the analysis pipeline:
        normalize -> resolve context -> feasibility -> source probe -> ambiguity
        Returns dict with resolved_query, needs_clarification, questions, status.
        """
        query = self.analyzer.normalize_input(raw_query)
        resolved_query = self.analyzer.resolve_context(query, chat_history or [])

        # Feasibility check
        feasibility = self.analyzer.check_feasibility(resolved_query)
        if not feasibility.get('is_feasible', True):
            return {
                "query": raw_query,
                "resolved_query": resolved_query,
                "needs_clarification": True,
                "reason": f"Not feasible: {feasibility.get('reason')}",
                "questions": ["This topic seems static or historical. Do you want to search for it once instead?"],
                "status": "not_feasible",
            }

        # Source availability
        source_probe = self.analyzer.probe_sources(resolved_query)
        if not source_probe.get('available', True):
            return {
                "query": raw_query,
                "resolved_query": resolved_query,
                "needs_clarification": True,
                "reason": f"No reliable sources: {source_probe.get('reason')}",
                "questions": ["I couldn't find public information on this. Could you double-check the name?"],
                "status": "no_sources",
            }

        # Ambiguity check
        ambiguity = self.analyzer.resolve_ambiguity(resolved_query)
        if ambiguity.get('is_ambiguous'):
            interpretations = ambiguity.get('interpretations', [])
            questions = [f"Did you mean: {i['label']}?" for i in interpretations]
            return {
                "query": raw_query,
                "resolved_query": resolved_query,
                "needs_clarification": True,
                "reason": "Query is ambiguous",
                "questions": questions if questions else ["Could you be more specific?"],
                "status": "ambiguous",
            }

        return {
            "query": raw_query,
            "resolved_query": resolved_query,
            "needs_clarification": False,
            "status": "ready",
        }

    # ------------------------------------------------------------------
    # One-shot Search
    # ------------------------------------------------------------------

    def search(self, query: str) -> Dict:
        """
        One-shot search: query Perplexity, assess status, return results.
        No tracking is created.
        """
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a helpful research assistant. Provide comprehensive and accurate "
                    "information based on current web sources. Respond in Japanese. "
                    "IMPORTANT: Always include the actual source URLs at the end of your response "
                    "in a 'Sources:' section."
                ),
            },
            {
                "role": "user",
                "content": f"{query}\n\nPlease include all source URLs at the end of your response.",
            },
        ]
        result = call_perplexity(messages, model="sonar", return_images=True)

        if isinstance(result, dict):
            content = result.get("content", "")
            images = result.get("images", [])
        else:
            content = result
            images = []

        status_info = self.analyzer.assess_topic_status(content)

        return {
            "content": content,
            "status": status_info["status"],
            "explanation": status_info["explanation"],
            "images": images,
        }

    # ------------------------------------------------------------------
    # Tracking CRUD
    # ------------------------------------------------------------------

    def create_tracking(self, user_id: str, query: str,
                        search_result: Optional[str] = None,
                        frequency: str = "daily",
                        custom_frequency_hours: Optional[int] = None,
                        notification_enabled: bool = True) -> Dict:
        """
        Create a new tracking: analyze intent -> architect strategy -> save to storage.
        Optionally accepts a prior search_result to skip the initial search.
        """
        # Analyze intent
        analysis = self.analyzer.analyze_intent(query)
        entities = analysis.get("entities", [])

        # If no prior search result, do one now
        if not search_result:
            search_data = self.search(query)
            search_result = search_data.get("content", "")

        # Architect strategy
        strategy = self.architect.generate_strategy(query, analysis, search_result)

        # Determine frequency
        if frequency == "custom" and custom_frequency_hours:
            freq_hours = custom_frequency_hours
        elif strategy.get("frequency_hours"):
            freq_hours = strategy["frequency_hours"]
            frequency, custom_frequency_hours = _hours_to_frequency(freq_hours)
        else:
            freq_hours = _frequency_to_hours(frequency)

        now = datetime.now()

        # Extract initial structured data
        schema_type = strategy.get("schema_type", "topic_watch")
        structured_data = self.extractor.extract_data(search_result, schema_type)

        tracking = tracking_storage.create_tracking(user_id, {
            "title": query,
            "query": query,
            "description": f"Track {analysis.get('category', 'topic')} for {', '.join(entities)}",
            "is_active": True,
            "frequency": frequency,
            "custom_frequency_hours": custom_frequency_hours,
            "notification_enabled": notification_enabled,
            "status": "tracking",
            "strategy": strategy,
            "keywords": strategy.get("search_queries", []),
            "last_search_result": structured_data,
            "last_executed_at": now.isoformat(),
            "next_execute_at": (now + timedelta(hours=freq_hours)).isoformat(),
            "image_url": "",
        })

        return tracking

    # ------------------------------------------------------------------
    # Execution & Update Detection
    # ------------------------------------------------------------------

    def execute_tracking(self, user_id: str, tracking_id: str) -> Optional[Dict]:
        """
        Run the tracking pipeline for a single tracking:
        execute -> extract -> diff -> notify.
        Returns update dict if found, else None.
        """
        tracking = tracking_storage.get_user_tracking(user_id, tracking_id)
        if not tracking:
            return None

        # Execute search
        search_content = self.executor.execute_plan(tracking)
        content_text = search_content.get("content", "") if isinstance(search_content, dict) else search_content

        # Extract structured data
        schema_type = tracking.get("strategy", {}).get("schema_type", "topic_watch")
        new_data = self.extractor.extract_data(content_text, schema_type)

        # Diff against previous
        update_obj = None
        old_data = tracking.get("last_search_result")

        if old_data and isinstance(old_data, dict):
            update_obj = self.differ.detect_structured_diff(old_data, new_data, schema_type)
        elif old_data:
            diff_text = self.differ.detect_text_diff(
                str(old_data), str(new_data), tracking.get("keywords", [])
            )
            if diff_text:
                update_obj = {"summary": diff_text, "changes": [], "sources": []}

        # Add citation sources if available
        if update_obj and isinstance(search_content, dict) and "citations" in search_content:
            update_obj["sources"] = [
                {"id": str(i), "title": f"Source {i}", "url": cite}
                for i, cite in enumerate(search_content.get("citations", []), 1)
            ]

        now = datetime.now()
        freq_hours = _frequency_to_hours(
            tracking.get("frequency", "daily"),
            tracking.get("custom_frequency_hours"),
        )

        # Update tracking state
        tracking_storage.update_tracking(user_id, tracking_id, {
            "last_search_result": new_data,
            "last_executed_at": now.isoformat(),
            "next_execute_at": (now + timedelta(hours=freq_hours)).isoformat(),
        })

        if update_obj:
            # Save update entry
            update_entry = {
                "title": update_obj["summary"][:80],
                "content": update_obj["summary"],
                "sources": update_obj.get("sources", []),
                "details": update_obj,
            }
            tracking_storage.add_update(user_id, tracking_id, update_entry)

            # Notify user
            if tracking.get("notification_enabled", True):
                self.notifier.notify_update(
                    user_id=user_id,
                    tracking_id=tracking_id,
                    title=f"Update: {tracking.get('title', '')}",
                    message=update_obj["summary"],
                    details=update_obj,
                )

            return update_entry

        return None

    # ------------------------------------------------------------------
    # Background Check
    # ------------------------------------------------------------------

    def check_all_updates(self):
        """Check all active trackings that are due for an update."""
        now = datetime.now()
        active_trackings = tracking_storage.get_active_trackings()
        updates_found = []

        for tracking in active_trackings:
            next_execute = tracking.get("next_execute_at")
            if next_execute and now >= datetime.fromisoformat(next_execute):
                user_id = tracking.get("user_id")
                tracking_id = tracking.get("id")

                if not user_id or not tracking_id:
                    continue

                try:
                    logger.info("Checking updates for: %s", tracking.get('title', tracking_id))
                    update = self.execute_tracking(user_id, tracking_id)
                    if update:
                        updates_found.append({
                            "tracking_id": tracking_id,
                            "title": tracking.get("title", ""),
                            "update": update.get("content", ""),
                        })
                except Exception as e:
                    logger.error("Error checking tracking %s: %s", tracking_id, e)

        return updates_found

    # ------------------------------------------------------------------
    # Feedback & Adaptive Learning
    # ------------------------------------------------------------------

    def handle_feedback(self, user_id: str, tracking_id: str,
                        notification_id: str, feedback: str) -> Dict:
        """
        Handle user feedback on a notification.
        If 'not_useful', trigger adaptive learning to adjust the tracking strategy.
        """
        if feedback != "not_useful":
            return {"status": "noted"}

        tracking = tracking_storage.get_user_tracking(user_id, tracking_id)
        if not tracking:
            return {"error": "Tracking not found"}

        feedback_summary = self.notifier.get_feedback_summary(tracking_id)
        if not feedback_summary.get("not_useful"):
            return {"message": "No negative feedback to analyze"}

        not_useful_examples = [f"- {f['message']}" for f in feedback_summary["not_useful"]]

        adjustment_prompt = f"""You are the 'Adaptive Learning Engine' for Burilar.
The user has marked several updates as 'not useful' for the following tracking:

Topic: {tracking.get('title', '')}
Description: {tracking.get('description', '')}
Current Keywords: {', '.join(tracking.get('keywords', []))}
Current Frequency: {tracking.get('frequency', 'daily')}

Recent 'Not Useful' Updates:
{chr(10).join(not_useful_examples)}

Task: Analyze why these updates are not useful and suggest improvements.
Respond in JSON format:
{{
  "thought": "brief analysis",
  "adjustments": {{
    "frequency": "daily",
    "keywords": ["new", "keywords"],
    "description": "new description"
  }}
}}"""

        messages = [{"role": "user", "content": adjustment_prompt + "\n\nRespond with ONLY the JSON object."}]

        try:
            response_text = call_perplexity(messages, model="sonar")
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            adjustment_data = json.loads(response_text[start_idx:end_idx])

            adjustments = adjustment_data.get("adjustments", {})
            update_data = {}

            if "frequency" in adjustments:
                update_data["frequency"] = adjustments["frequency"]
            if "keywords" in adjustments:
                update_data["keywords"] = adjustments["keywords"]
            if "description" in adjustments:
                update_data["description"] = adjustments["description"]

            if update_data:
                tracking_storage.update_tracking(user_id, tracking_id, update_data)

            return {
                "status": "adjusted",
                "thought": adjustment_data.get("thought"),
                "applied_changes": adjustments,
            }

        except Exception as e:
            logger.error("Adaptive Learning Error: %s", e)
            return {"error": str(e)}
