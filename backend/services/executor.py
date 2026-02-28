from typing import List, Dict, Optional
from backend.utils.ai_client import call_ai

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
            result = call_ai(messages, task="web_search", return_images=True)
            if isinstance(result, str):
                 return {"content": result, "citations": [], "images": []}
            return result
        except Exception as e:
            print(f"Executor Error: {str(e)}")
            return {"content": "Error retrieving search results.", "citations": [], "images": []}
