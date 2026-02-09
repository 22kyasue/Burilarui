import json
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from backend.models.tracking import TrackingPlan
from backend.services.perplexity import call_perplexity
from backend.services.analyzer import TrackingAnalyzer
from backend.services.architect import TrackingArchitect
from backend.services.executor import TrackingExecutor
from backend.services.extractor import InformationExtractor
from backend.services.notifier import NotificationManager

class BurilarTracker:
    """
    Core logic for the Burilar tracking system.
    Orchestrates the 'Brain' (Analyzer), 'Architect', 'Analyst' (Executor/Extractor), and 'Broadcaster' (Notifier).
    """
    
    def __init__(self):
        self.tracking_plans: Dict[str, TrackingPlan] = {}
        self.data_file = "burilar_tracking_data.json"
        
        # Services
        self.analyzer = TrackingAnalyzer()
        self.architect = TrackingArchitect()
        self.executor = TrackingExecutor()
        self.extractor = InformationExtractor()
        self.notifier = NotificationManager()
        
        self.load_tracking_plans()
    
    def process_query(self, raw_query: str, chat_history: Optional[List[Dict]] = None) -> Dict:
        """
        Orchestrate the analysis pipeline:
        1. Normalize
        2. Resolve Context
        3. Check Feasibility
        4. Resolve Ambiguity
        """
        # 1. Normalize
        query = self.analyzer.normalize_input(raw_query)
        
        # 2. Resolve Context
        resolved_query = self.analyzer.resolve_context(query, chat_history or [])
        
        # 3. Check Feasibility (Static/Dynamic)
        feasibility = self.analyzer.check_feasibility(resolved_query)
        if not feasibility.get('is_feasible', True):
            return {
                "original_query": raw_query,
                "resolved_query": resolved_query,
                "needs_clarification": True,
                "reason": f"Not feasible: {feasibility.get('reason')}",
                "clarification_questions": ["This topic seems static or historical. Do you want to search for it once instead?"],
                "status": "not_feasible"
            }

        # 3.1 Check Source Availability (The Gatekeeper)
        source_probe = self.analyzer.probe_sources(resolved_query)
        if not source_probe.get('available', True):
            return {
                "original_query": raw_query,
                "resolved_query": resolved_query,
                "needs_clarification": True,
                "reason": f"No reliable sources finding: {source_probe.get('reason')}",
                "clarification_questions": ["I couldn't find public information on this. Could you double-check the name?"],
                "status": "no_sources"
            }

        # 4. Check Ambiguity
        ambiguity = self.analyzer.resolve_ambiguity(resolved_query)
        if ambiguity.get('is_ambiguous'):
            interpretations = ambiguity.get('interpretations', [])
            questions = [f"Did you mean: {i['label']}?" for i in interpretations]
            return {
                "original_query": raw_query,
                "resolved_query": resolved_query,
                "needs_clarification": True,
                "reason": "Query is ambiguous",
                "clarification_questions": questions if questions else ["Could you be more specific?"],
                "status": "ambiguous"
            }
            
        return {
            "original_query": raw_query,
            "resolved_query": resolved_query,
            "needs_clarification": False,
            "status": "ready"
        }
    
    def check_needs_clarification(self, query: str) -> Dict:
        # Legacy wrapper - prefer process_query
        return self.process_query(query)
    
    def search_with_ai(self, query: str) -> str:
        """Perform a web search using Perplexity AI (Legacy direct call)."""
        messages = [
            {
                "role": "system",
                "content": "You are a helpful research assistant. Provide comprehensive and accurate information based on current web sources. IMPORTANT: Always include the actual source URLs at the end of your response in a 'Sources:' section, listing each source with its full URL."
            },
            {
                "role": "user",
                "content": f"{query}\n\nPlease include all source URLs at the end of your response in a clear 'Sources:' section."
            }
        ]
        
        return call_perplexity(messages, model="sonar")

    def search_with_ai_enhanced(self, query: str) -> Dict:
        """Perform a web search using Perplexity AI, returning images if available."""
        messages = [
            {
                "role": "system",
                "content": "You are a helpful research assistant. Provide comprehensive and accurate information based on current web sources. Respond in Japanese. IMPORTANT: Always include the actual source URLs at the end of your response in a 'Sources:' section, listing each source with its full URL."
            },
            {
                "role": "user",
                "content": f"{query}\n\nPlease include all source URLs at the end of your response in a clear 'Sources:' section."
            }
        ]

        # Use return_images=True to get images
        result = call_perplexity(messages, model="sonar", return_images=True)

        if isinstance(result, dict):
            return result
        # Fallback if error occurred
        return {"content": result, "images": []}
    
    def assess_topic_status(self, search_result: str) -> Dict:
        """Determine if a topic is 'Completed' or 'In Progress'."""
        assessment_prompt = f"""You are analyzing whether a topic needs ongoing tracking or if it's already resolved.

Search Result:
{search_result}

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
        
        messages = [
            {"role": "user", "content": assessment_prompt}
        ]
        
        content = call_perplexity(messages, model="sonar")
        
        # Extract just the status and first sentence
        lines = content.strip().split('\n')
        status_line = lines[0] if lines else content
        explanation_line = lines[1] if len(lines) > 1 else ""
        
        # Clean up the explanation to be concise
        explanation = explanation_line.strip()
        if not explanation and len(lines) > 0:
            explanation = status_line
            
        status = "completed" if "Completed" in status_line else "in_progress"
        return {"status": status, "explanation": explanation}
    
    def generate_tracking_plan(self, user_prompt: str, search_result: str) -> TrackingPlan:
        """
        Generate a detailed tracking plan using the Brain (Analyzer) and Architect.
        Phase 1: Analyze Intent
        Phase 2: Generate Strategy
        """
        # Phase 1: Analyze Intent
        analysis = self.analyzer.analyze_intent(user_prompt)
        entities = analysis.get("entities", [])
        
        # Phase 2: Architect Strategy
        strategy = self.architect.generate_strategy(user_prompt, analysis, search_result)

        # Create basic plan
        plan = TrackingPlan(
            topic=user_prompt,
            objective=f"Track {analysis.get('category')} for {', '.join(entities)}",
            frequency_hours=strategy.get("frequency_hours", 24), # Frequency from Architect
            keywords=strategy.get("search_queries", []), # Use generated queries as keywords for now
            status="pending",
            strategy=strategy # Store full strategy
        )
        plan.suggested_prompt = f"Tracking {user_prompt} based on {len(strategy.get('priority_sources', []))} priority sources."
        return plan
    
    def detect_differences(self, old_result: str, new_result: str, keywords: List[str]) -> Optional[str]:
        """Legacy Compare: Text-based."""
        diff_prompt = f"""Compare these two search results and identify if there are SIGNIFICANT new developments.

Previous Result:
{old_result[:1000]}

New Result:
{new_result[:1000]}

Important Keywords to Watch: {', '.join(keywords)}

If there are meaningful updates (new facts, events, or milestones), respond with "UPDATE:" followed by a summary.
If there are no significant changes, respond with only "NO_CHANGE".
"""
        messages = [
            {"role": "user", "content": diff_prompt}
        ]
        
        result = call_perplexity(messages, model="sonar")
        
        if result.startswith("UPDATE:"):
            return result.replace("UPDATE:", "").strip()
        return None

    
    def _detect_structured_diff(self, old_data: Dict, new_data: Dict, schema_type: str) -> Optional[Dict]:
        """
        Compare two structured JSON objects.
        Returns a detailed update object if there is a meaningful update, else None.
        structure: { "summary": str, "changes": List[str], "sources": List[Dict] }
        """
        if not old_data or not new_data:
            return None
            
        changes = []
        summary = ""
        
        if schema_type == "release_watch":
            # Check Status or Date change
            if old_data.get("status") != new_data.get("status"):
                changes.append(f"Status changed from {old_data.get('status')} to {new_data.get('status')}")
            if old_data.get("date") != new_data.get("date"):
                changes.append(f"Release date updated from {old_data.get('date')} to {new_data.get('date')}")
            
            if changes:
                summary = "Release information has been updated."

        elif schema_type == "metric_tracking":
            # Check Value change > 5% (heuristic)
            try:
                old_val = float(old_data.get("value", 0))
                new_val = float(new_data.get("value", 0))
                if old_val != 0:
                    pct_change = abs((new_val - old_val) / old_val)
                    if pct_change > 0.05: # 5% threshold
                        direction = "up" if new_val > old_val else "down"
                        changes.append(f"Value moved {direction} by {pct_change:.1%} ({old_val} -> {new_val})")
                        summary = f"Significant value change detected ({direction} {pct_change:.1%})."
            except:
                pass # Fallback if values aren't numbers
                
        # Fallback: Check summary text similarity if structured check didn't trigger
        if not changes and old_data.get("latest_update_summary") != new_data.get("latest_update_summary"):
             # Use LLM to verify if the summary difference is meaningful
             diff_text = self.detect_differences(
                 str(old_data), 
                 str(new_data), 
                 []
             )
             if diff_text:
                 summary = diff_text
                 changes.append("General update detected in summary.")
        
        if summary or changes:
            return {
                "summary": summary if summary else "New updates detected.",
                "changes": changes,
                "sources": new_data.get("sources", []) # Assuming extractor puts sources here or we merge them later
            }
             
        return None
    
    def start_tracking(self, plan: TrackingPlan):
        """Add a tracking plan to active tracking."""
        self.tracking_plans[plan.id] = plan
        plan.active = True
        plan.status = "tracking"
        plan.next_search_time = datetime.now() + timedelta(hours=plan.frequency_hours)
        
        # Phase 3: Initial Execution to set baseline
        if not plan.last_search_result:
             print(f"Running initial execution for plan {plan.id}...")
             search_content = self.executor.execute_plan(plan)
             # FIX: Extract string content if search_content is a dict
             content_text = search_content.get("content", "") if isinstance(search_content, dict) else search_content
             schema_type = plan.strategy.get("schema_type", "topic_watch")
             structured_data = self.extractor.extract_data(content_text, schema_type)
             plan.last_search_result = structured_data # Store JSON
             plan.last_search_time = datetime.now()

        self.save_tracking_plans()
    
    def check_tracking_updates(self):
        """Check all active tracking plans for updates."""
        now = datetime.now()
        updates_found = []
        
        for plan_id, plan in self.tracking_plans.items():
            if not plan.active:
                continue
            
            if plan.next_search_time and now >= plan.next_search_time:
                print(f"Checking updates for {plan.topic}...")
                
                # Phase 3: Execute & Extract
                search_content = self.executor.execute_plan(plan)
                
                # FIX: Extract string content from dict
                content_text = search_content.get("content", "") if isinstance(search_content, dict) else search_content
                
                schema_type = plan.strategy.get("schema_type", "topic_watch")
                new_structured_data = self.extractor.extract_data(content_text, schema_type)
                
                # Compare with previous result
                update_obj = None
                if plan.last_search_result:
                    # Check if last_result is dict (migrated) or str (legacy)
                    if isinstance(plan.last_search_result, dict):
                         # If search_content is dict (from new executor), extract content string for extractor
                         content_text = search_content.get("content", "") if isinstance(search_content, dict) else search_content
                         
                         structured_diff = self._detect_structured_diff(
                             plan.last_search_result,
                             new_structured_data,
                             schema_type
                         )
                         if structured_diff:
                             update_obj = structured_diff
                             # Add citations if available from executor
                             if isinstance(search_content, dict) and "citations" in search_content:
                                 # Setup sources for the UI
                                 update_obj["sources"] = []
                                 for idx, cite in enumerate(search_content.get("citations", []), 1):
                                     update_obj["sources"].append({
                                         "id": str(idx),
                                         "title": "Source " + str(idx), # Perplexity citations might be just URLs?
                                         "url": cite
                                     })


                    else:
                        # Legacy fallback
                        diff_text = self.detect_differences(
                            str(plan.last_search_result),
                            str(new_structured_data),
                            plan.keywords
                        )
                        if diff_text:
                            update_obj = {
                                "summary": diff_text,
                                "changes": [],
                                "sources": []
                            }
                    
                    if update_obj:
                        update_entry = {
                            'timestamp': now.isoformat(),
                            'update': update_obj['summary'], # Legacy compat
                            'details': update_obj,           # New rich data
                            'data': new_structured_data 
                        }
                        plan.updates.append(update_entry)
                        
                        # Phase 4: Notify User
                        self.notifier.add_notification(
                            title=f"Update: {plan.topic}",
                            message=update_obj['summary'],
                            type="update",
                            plan_id=plan_id,
                            details=update_obj # Pass rich details
                        )
                        
                        updates_found.append({
                            'plan_id': plan_id,
                            'topic': plan.topic,
                            'update': update_obj['summary']
                        })
                
                # Update tracking plan
                plan.last_search_result = new_structured_data
                plan.last_search_time = now
                plan.next_search_time = now + timedelta(hours=plan.frequency_hours)
                self.save_tracking_plans()
        
        return updates_found
    
    def save_tracking_plans(self):
        """Save tracking plans to file."""
        data = {plan_id: plan.to_dict() for plan_id, plan in self.tracking_plans.items()}
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def load_tracking_plans(self):
        """Load tracking plans from file."""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    for plan_id, plan_dict in data.items():
                        try:
                            plan = TrackingPlan.from_dict(plan_dict)
                            self.tracking_plans[plan_id] = plan
                        except Exception as e:
                            print(f"Error loading plan {plan_id}: {str(e)}")
            except Exception as e:
                print(f"Error loading tracking plans: {str(e)}")

    def get_user_plans(self, user_id: str) -> List[TrackingPlan]:
        """Get all tracking plans for a specific user."""
        return [plan for plan in self.tracking_plans.values() if plan.user_id == user_id]
