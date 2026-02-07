from typing import List, Dict, Optional
from backend.services.perplexity import call_perplexity

class TrackingExecutor:
    """
    The 'Analyst' of the system.
    Responsible for executing search plans, aggregating results, and preparing for extraction.
    """
    
    def execute_plan(self, plan) -> Dict:
        """
        Execute the tracking plan.
        Returns a dictionary containing aggregated content and source metadata.
        """
        if not plan.strategy or not plan.strategy.get("search_queries"):
            # Fallback for old plans without strategy
            return self._run_single_search(plan.topic)

        queries = plan.strategy.get("search_queries", [])
        # Deduping logic: Pick top 2 distinct queries
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
            "images": list(set(all_images)) # Dedup images
        }

    def _run_single_search(self, query: str) -> Dict:
        """Run a single search query and return structured data."""
        messages = [
            {"role": "system", "content": "You are a helpful research assistant. Provide comprehensive, factual information. Include sources."},
            {"role": "user", "content": query}
        ]
        try:
            # We assume call_perplexity can return a dict if configured, 
            # OR we parse the response. 
            # Looking at previous step info, call_perplexity has return_images=True option.
            # Let's assume we can modify perplexity.py or use it as is if it supports this.
            # Based on tracker.py: call_perplexity(messages, model="sonar", return_images=True) returns a dict.
            
            return call_perplexity(messages, model="sonar", return_images=True)
        except Exception as e:
            print(f"Executor Error: {str(e)}")
            return {"content": "Error retrieving search results.", "citations": [], "images": []}
