"""
Tracking Executor
Executes search plans, aggregates results, and prepares for extraction.
Updated to work with tracking dicts instead of TrackingPlan objects.
"""

import logging
from typing import Dict
from backend.services.perplexity import call_perplexity

logger = logging.getLogger(__name__)


class TrackingExecutor:
    """
    The 'Analyst' of the system.
    Responsible for executing search plans, aggregating results, and preparing for extraction.
    """

    def execute_plan(self, tracking: Dict) -> Dict:
        """
        Execute the tracking plan.
        Accepts a tracking dict (from storage) instead of a TrackingPlan object.
        Returns a dictionary containing aggregated content and source metadata.
        """
        strategy = tracking.get('strategy', {})
        queries = strategy.get('search_queries', [])

        if not queries:
            # Fallback: search by title/query
            fallback_query = tracking.get('query') or tracking.get('title', '')
            return self._run_single_search(fallback_query)

        # Pick top 2 distinct queries
        target_queries = queries[:2]

        aggregated_content = []
        all_citations = []
        all_images = []

        for query in target_queries:
            result = self._run_single_search(query)
            aggregated_content.append(f"--- Query: {query} ---\n{result.get('content', '')}\n")
            all_citations.extend(result.get('citations', []))
            all_images.extend(result.get('images', []))

        return {
            "content": "\n".join(aggregated_content),
            "citations": all_citations,
            "images": list(set(all_images))
        }

    def _run_single_search(self, query: str) -> Dict:
        """Run a single search query and return structured data."""
        messages = [
            {"role": "system", "content": "You are a helpful research assistant. Provide comprehensive, factual information. Include sources."},
            {"role": "user", "content": query}
        ]
        try:
            result = call_perplexity(messages, model="sonar", return_images=True)
            if isinstance(result, str):
                return {"content": result, "citations": [], "images": []}
            return result
        except Exception as e:
            logger.error("Executor Error: %s", e)
            return {"content": "Error retrieving search results.", "citations": [], "images": []}
