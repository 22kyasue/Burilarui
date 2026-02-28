import json
import re
from typing import Dict, List, Optional
from urllib.parse import urlparse
from backend.utils.ai_client import call_ai

class TrackingArchitect:
    """
    The 'Architect' of the system.
    Responsible for designing the research strategy (queries, sources, frequency)
    based on the intent and initial search results.
    """

    def generate_strategy(self, topic: str, intent_data: Dict, initial_search_result: str) -> Dict:
        """
        Generate a comprehensive tracking strategy.
        """
        # 1. Discover Sources from initial search
        priority_sources = self._discover_sources(initial_search_result)
        
        # 2. Determine Frequency based on intent
        frequency = self._determine_frequency(intent_data)
        
        # 3. Generate Comprehensive Strategy (Queries, Structure, Missing Points, Triggers) using LLM
        strategy_details = self._generate_comprehensive_strategy(topic, intent_data, priority_sources)
        
        return {
            "topic": topic,
            "intent": intent_data.get("category"),
            "frequency_hours": frequency,
            "priority_sources": priority_sources,
            "search_queries": strategy_details.get("search_queries", [f"{topic} latest news"]),
            "structure_items": strategy_details.get("structure_items", []),
            "missing_points": strategy_details.get("missing_points", []),
            "notification_triggers": strategy_details.get("notification_triggers", []),
            "schema_type": intent_data.get("category", "general") # To be used in Phase 3
        }

    def _discover_sources(self, search_text: str) -> List[str]:
        """
        Extract high-quality domains from the initial search result text.
        """
        # Regex to find URLs
        urls = re.findall(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+', search_text)
        
        domains = set()
        ignored_domains = {
            "google.com", "bing.com", "yahoo.com", "duckduckgo.com", 
            "youtube.com", "facebook.com", "twitter.com", "instagram.com",
            "wikipedia.org", "perplexity.ai"
        }
        
        for url in urls:
            try:
                domain = urlparse(url).netloc
                # Remove www.
                if domain.startswith("www."):
                    domain = domain[4:]
                
                if domain and domain not in ignored_domains:
                    domains.add(domain)
            except:
                continue
                
        return list(domains)[:5] # Return top 5 distinct domains

    def _determine_frequency(self, intent_data: Dict) -> int:
        """
        Suggest check frequency based on intent category.
        """
        category = intent_data.get("category")
        if category == "event_monitoring":
            return 1 # Hourly for live events
        elif category == "metric_tracking":
            return 6 # 4 times a day for volatile metrics
        elif category == "release_watch":
            return 12 # Twice a day for leaks/news
        else:
            return 24 # Daily for general topics

    def _generate_comprehensive_strategy(self, topic: str, intent_data: Dict, sources: List[str]) -> Dict:
        """
        Generate a detailed tracking strategy including queries, structure, missing points, and triggers.
        """
        category = intent_data.get("category", "topic_watch")
        
        prompt = f"""Design a comprehensive tracking strategy for this topic.

Topic: {topic}
Category: {category}
Known Sources: {', '.join(sources)}

Your goal is to create a structure for ongoing monitoring.
Provide a JSON object with the following keys:
1. "search_queries": List of 3-5 distinct search queries.
2. "structure_items": List of 3 objects, each with "color" (one of "indigo", "purple", "pink", "amber", "emerald"), "title", and "description". These represent the key viewpoints or pillars of tracking.
3. "missing_points": List of 3-4 objects with "text". These are specific unknowns or future details we are waiting for.
4. "notification_triggers": List of 4-5 objects with "text". Specific events that should trigger a user notification.

Strategy by Category Hints:
- release_watch: Focus on release dates, official announcements. Triggers: "Official date confirmed", "Pre-orders start".
- metric_tracking: Focus on numbers, charts. Triggers: "Value exceeds X", "Trend reversal".
- event_monitoring: Focus on live updates. Triggers: "Key speech starts", "Winner announced".
- topic_watch: Focus on general developments. Triggers: "Major policy change", "New report published".

Respond with ONLY the valid JSON object.
"""
        messages = [{"role": "user", "content": prompt}]
        try:
            response_text = call_ai(messages, task="generation")
            
            # Robust JSON extraction
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx+1]
                return json.loads(json_str)
            
            # Fallback if JSON parsing fails
            print("Failed to parse JSON from Architect response")
            return {
                "search_queries": [f"{topic} latest news"],
                "structure_items": [],
                "missing_points": [],
                "notification_triggers": []
            }
        except Exception as e:
            print(f"Architect Error: {str(e)}")
            return {
                "search_queries": [f"{topic} latest news"],
                "structure_items": [],
                "missing_points": [],
                "notification_triggers": []
            }

    def refine_from_feedback(self, plan) -> dict:
        """
        Regenerate search queries and strategy when user repeatedly marks
        updates as not_useful. Returns updated strategy dict.
        """
        prompt = f"""The user found the following tracking updates unhelpful.
Topic: {plan.topic}
Current search queries: {plan.strategy.get('search_queries', [])}
Current keywords: {plan.keywords}

The user needs more relevant, specific, or different information.
Regenerate the tracking strategy with fresh angles and better queries.

Return JSON:
{{
  "search_queries": ["..."],
  "keywords": ["..."],
  "structure_items": [...],
  "missing_points": [...],
  "notification_triggers": [...],
  "change_summary": "one sentence explaining what changed"
}}

Respond with ONLY the valid JSON object."""

        messages = [{"role": "user", "content": prompt}]
        response_text = call_ai(messages, task="generation")

        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')

        if start_idx != -1 and end_idx != -1:
            json_str = response_text[start_idx:end_idx+1]
            return json.loads(json_str)

        raise ValueError(f"Failed to parse JSON from refine_from_feedback response: {response_text}")
