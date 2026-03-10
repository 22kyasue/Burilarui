import json
from typing import Dict, List, Optional
from backend.utils.ai_client import call_ai

class TrackingAnalyzer:
    """
    The 'Brain' of the tracking system.
    Analyzes user intent, checks feasibility, and resolves ambiguity.
    """

    def analyze_intent(self, query: str) -> Dict:
        """
        Classify the user's intent into specific tracking categories.
        """
        prompt = f"""Analyze the following user query and classify the tracking intent.

Query: {query}

Categories:
1. "release_watch": Tracking a specific future release date (product, software, movie, game).
2. "event_monitoring": Tracking a specific event's outcome or progress (election, trial, sports match).
3. "metric_tracking": Tracking a numerical value or statistic (stock price, infection rate, poll numbers).
4. "topic_watch": General monitoring of a broad topic for news (company news, industry trends).

Respond in JSON format:
{{
  "category": "release_watch" (or event_monitoring, metric_tracking, topic_watch),
  "confidence": 0.0 to 1.0,
  "entities": ["entity1", "entity2"], // Key entities extracted from query
  "reasoning": "brief explanation"
}}
"""
        return self._get_json_response(prompt)

    def check_feasibility(self, query: str) -> Dict:
        """
        Determine if the topic is suitable for ongoing tracking.
        Rejects static facts or historical events.
        """
        prompt = f"""Assess if this query is suitable for ONGOING real-time tracking.

Query: {query}

Guidance:
- FEASIBLE: Future events, ongoing developing stories, changing metrics.
- NOT_FEASIBLE: Historical facts (who won WWII), static info (capital of France), completed events with no expected updates.

Respond in JSON format:
{{
  "is_feasible": true/false,
  "reason": "explanation",
  "suggested_action": "track" or "reject"
}}
"""
        return self._get_json_response(prompt)

    def resolve_context(self, query: str, chat_history: List[Dict]) -> str:
        """
        Resolve context from chat history if the query is dependent (e.g., "track it").
        Returns the resolved standalone query.
        """
        if not chat_history:
            return query
            
        # Quick check for context dependence keywords
        context_keywords = ["it", "that", "this", "the event", "the election", "him", "her", "them"]
        is_dependent = any(word in query.lower().split() for word in context_keywords) or len(query.split()) < 3
        
        if not is_dependent:
            return query
            
        # Format history for LLM
        history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history[-6:]]) # Last 3 turns
        
        prompt = f"""Resolve the user's latest query into a standalone, explicit search query based on the chat history.

Chat History:
{history_text}

Latest Query: "{query}"

Task: Replace pronouns/references ("it", "that", "the election") with the specific entities mentioned earlier.
If the query is already specific, return it as is.

Respond with ONLY the resolved query string.
"""
        messages = [{"role": "user", "content": prompt}]
        try:
            resolved_query = call_ai(messages, task="generation").strip().strip('"')
            return resolved_query
        except Exception as e:
            print(f"Context Resolution Error: {str(e)}")
            return query

    def normalize_input(self, query: str) -> str:
        """
        Standardize input (trim whitespace, remove excessive punctuation).
        This could be expanded for multi-language normalization.
        """
        return query.strip()

    def resolve_ambiguity(self, query: str) -> Dict:
        """
        Check if the query needs clarification and propose specific interpretations.
        """
        prompt = f"""Analyze if this query is ambiguous and needs clarification before tracking.

Query: {query}

If ambiguous, propose specific, distinct interpretations the user might mean.

Examples:
- "Election" -> Which country? Which year?
- "Apple" -> The company or the fruit? (Context usually implies company)

Respond in JSON format:
{{
  "is_ambiguous": true/false,
  "clarification_needed": true/false,
  "interpretations": [
    {{"label": "Interpretation A", "value": "Refined Query A"}},
    {{"label": "Interpretation B", "value": "Refined Query B"}}
  ]
}}
"""
        return self._get_json_response(prompt)

    def probe_sources(self, query: str) -> Dict:
        """
        Check if reliable public sources exist for this topic.
        Acts as a 'Gatekeeper' to prevent tracking non-existent or private topics.
        """
        prompt = f"""Assess if there are reliable, accessible public sources for ongoing information about this topic.

Query: {query}

Guidance:
- AVAILABLE: Topics with official websites, news coverage, public documentation, or active community discussions.
- UNAVAILABLE: Private personal info, internal company data, made-up/fictional topics without a fanbase, or extremely obscure micro-topics.

Respond in JSON format:
{{
  "available": true/false,
  "reason": "explanation of what kind of sources exist (or don't)",
  "source_types": ["official_site", "news", "social_media"]
}}
"""
        return self._get_json_response(prompt)

    def assess_topic_status(self, search_result: str) -> Dict:
        """
        Determine if a topic is 'completed' or 'in_progress' based on search results.
        Moved from BurilarTracker.
        """
        assessment_prompt = f"""You are analyzing whether a topic needs ongoing tracking or if it's already resolved.

Search Result:
{search_result[:3000]}

Your task is to be VERY STRICT about what qualifies as "In Progress". Most questions should be "Completed".

"Completed" - Choose this if:
- The question has been definitively answered with a clear outcome
- An event has concluded with a final result (elections with declared winners, trials with verdicts, etc.)
- Historical information or past events where all facts are established
- Product launches, releases, or announcements that already happened

"In Progress" - ONLY choose this if:
- A significant, ongoing process with major milestones still expected
- Future events that haven't occurred yet (upcoming elections, product launches not yet happened)
- Active investigations/trials WITHOUT a final verdict/conclusion
- Developing situations where the PRIMARY question remains unanswered

Respond with ONLY "Completed" or "In Progress" on the first line, followed by ONE concise sentence (max 20 words) explaining why."""

        messages = [{"role": "user", "content": assessment_prompt}]

        content = call_perplexity(messages, model="sonar")

        lines = content.strip().split('\n')
        status_line = lines[0] if lines else content
        explanation_line = lines[1] if len(lines) > 1 else ""

        explanation = explanation_line.strip()
        if not explanation and len(lines) > 0:
            explanation = status_line

        status = "completed" if "Completed" in status_line else "in_progress"
        return {"status": status, "explanation": explanation}

    def _get_json_response(self, prompt: str) -> Dict:
        """Helper to call AI and parse JSON."""
        messages = [{"role": "user", "content": prompt + "\n\nRespond with ONLY the JSON object."}]
        try:
            response_text = call_ai(messages, task="generation")
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                return json.loads(response_text[start_idx:end_idx])
            return json.loads(response_text)
        except Exception as e:
            print(f"Analyzer Error: {str(e)}")
            return {"error": str(e)}
