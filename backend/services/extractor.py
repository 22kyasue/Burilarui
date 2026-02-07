import json
from typing import Dict, Any, Optional
from backend.services.perplexity import call_perplexity

class InformationExtractor:
    """
    The 'Extractor' engine.
    Converts unstructured search results into structured JSON data based on schema type.
    """
    
    def extract_data(self, text: str, schema_type: str) -> Dict[str, Any]:
        """
        Extract structured data from text using an LLM.
        """
        schema_definition = self._get_schema(schema_type)
        
        prompt = f"""Extract precise information from the search results below into a valid JSON object.
        
Search Results:
{text[:3000]}

Target JSON Schema:
{json.dumps(schema_definition, indent=2)}

Guidance:
- Only extract what is explicitly stated or strongly implied by the text.
- If a field is missing, use null.
- "status" should be one of the enum values if provided.
- "value" should be a number if possible, or a string if complex (e.g. "$95k").
- Ensure the "source_url" is extracted if available in text.

Respond with ONLY the JSON object.
"""
        messages = [{"role": "user", "content": prompt}]
        try:
            response_text = call_perplexity(messages, model="sonar")
            return self._parse_json(response_text)
        except Exception as e:
            print(f"Extractor Error: {str(e)}")
            return {}

    def _get_schema(self, schema_type: str) -> Dict:
        """Define schemas for different intent types."""
        if schema_type == "release_watch":
            return {
                "status": "confirmed | rumored | delayed | released",
                "date": "YYYY-MM-DD or 'Quarter YYYY'",
                "confidence": "high | medium | low",
                "latest_update_summary": "One sentence summary of the latest news",
                "source_url": "URL of the primary source"
            }
        elif schema_type == "metric_tracking":
            return {
                "value": "Numeric value or string (e.g. 100.5 or '$95k')",
                "unit": "Unit string (e.g. USD, Users)",
                "trend": "up | down | stable",
                "timestamp": "Time of extraction",
                "source_url": "URL of the data source"
            }
        else: # default/topic_watch
            return {
                "status": "ongoing | completed",
                "key_developments": ["List of key points"],
                "latest_update_summary": "Summary of latest news",
                "source_url": "Primary source"
            }

    def _parse_json(self, text: str) -> Dict:
        """Robust JSON extraction."""
        try:
            start_idx = text.find('{')
            end_idx = text.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                return json.loads(text[start_idx:end_idx])
            return json.loads(text)
        except:
            return {}
