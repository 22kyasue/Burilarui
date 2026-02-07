import json
import re
from typing import Dict, List, Optional
from urllib.parse import urlparse
from backend.services.perplexity import call_perplexity

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
        
        # 3. Generate Specific Queries using LLM
        queries = self._generate_queries(topic, intent_data, priority_sources)
        
        return {
            "topic": topic,
            "intent": intent_data.get("category"),
            "frequency_hours": frequency,
            "priority_sources": priority_sources,
            "search_queries": queries,
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

    def _generate_queries(self, topic: str, intent_data: Dict, sources: List[str]) -> List[str]:
        """
        Generate diverse search queries to cover different angles.
        """
        category = intent_data.get("category", "topic_watch")
        
        prompt = f"""Generate 3-5 distinct, high-quality search queries to track this topic.

Topic: {topic}
Category: {category}
Known Sources: {', '.join(sources)}

Strategy by Category:
- release_watch: Focus on "release date", "leaks", "official announcement", "delays".
- metric_tracking: Focus on "current price", "latest stats", "chart", "live data".
- event_monitoring: Focus on "live updates", "results", "key moments", "timeline".
- topic_watch: Focus on "latest news", "developments", "analysis".

Respond with ONLY a JSON list of strings.
Example: ["iPhone 16 release date leaks", "iPhone 16 specs rumors", "Apple official announcement events"]
"""
        messages = [{"role": "user", "content": prompt + "\n\nRespond with ONLY the JSON list."}]
        try:
            response_text = call_perplexity(messages, model="sonar")
            
            # Robust JSON extraction: Find the first outer [] pair
            start_idx = response_text.find('[')
            if start_idx == -1:
                return [f"{topic} latest news"]
                
            depth = 0
            end_idx = -1
            for i, char in enumerate(response_text[start_idx:], start=start_idx):
                if char == '[':
                    depth += 1
                elif char == ']':
                    depth -= 1
                    if depth == 0:
                        end_idx = i + 1
                        break
            
            if end_idx != -1:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
                
            return [f"{topic} latest news"]
        except Exception as e:
            print(f"Architect Error: {str(e)}")
            return [f"{topic} latest news"]
