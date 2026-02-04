import os
import json
import time
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import requests
from typing import Dict, List, Optional
import threading

# Initialize Flask app - serve static files from build folder
app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app)

# Register API blueprints
from backend.routes import notifications_bp
app.register_blueprint(notifications_bp)

# Perplexity API configuration
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY", "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")  # Set via environment variable or replace placeholder
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

def call_perplexity(messages: List[Dict], model: str = "sonar"):
    """Make a request to Perplexity API."""
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 4000,
        "return_citations": True,  # Request citation information
        "return_images": False
    }
    
    try:
        response = requests.post(PERPLEXITY_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        
        # Extract the main content
        content = result['choices'][0]['message']['content']
        
        # Try to append citations if available
        if 'citations' in result and result['citations']:
            content += "\n\n**Sources:**\n"
            for i, citation in enumerate(result['citations'], 1):
                content += f"[{i}] {citation}\n"
        
        return content
    except requests.exceptions.HTTPError as e:
        # Print the full error response for debugging
        try:
            error_detail = response.json()
            print(f"Perplexity API Error: {error_detail}")
            return f"Error calling Perplexity API: {error_detail}"
        except:
            return f"Error calling Perplexity API: {str(e)}"
    except Exception as e:
        return f"Error calling Perplexity API: {str(e)}"

class TrackingPlan:
    """Represents a tracking plan for a specific topic."""
    def __init__(self, topic: str, objective: str, frequency_hours: int, keywords: List[str], status: str = "pending"):
        self.id = str(int(time.time() * 1000))
        self.topic = topic
        self.objective = objective
        self.frequency_hours = frequency_hours
        self.keywords = keywords
        self.last_search_result = ""
        self.last_search_time = None
        self.next_search_time = None
        self.active = False  # Start as inactive, activate when user confirms
        self.created_at = datetime.now()
        self.updates = []
        self.status = status  # "pending", "tracking", "completed", "needs_clarification"
        self.original_query = ""
        self.clarification_info = None
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'topic': self.topic,
            'objective': self.objective,
            'frequency_hours': self.frequency_hours,
            'keywords': self.keywords,
            'last_search_result': self.last_search_result,
            'last_search_time': self.last_search_time.isoformat() if self.last_search_time else None,
            'next_search_time': self.next_search_time.isoformat() if self.next_search_time else None,
            'active': self.active,
            'created_at': self.created_at.isoformat(),
            'updates': self.updates,
            'status': self.status,
            'original_query': self.original_query,
            'clarification_info': self.clarification_info
        }

class BurilarTracker:
    """Main class for the Burilar AI Information Tracking Service."""
    
    def __init__(self):
        self.tracking_plans: Dict[str, TrackingPlan] = {}
        self.data_file = "burilar_tracking_data.json"
        self.load_tracking_plans()
    
    def check_needs_clarification(self, query: str) -> Dict:
        """Check if a query needs clarification before searching."""
        clarification_prompt = f"""Analyze this query and determine if it needs clarification before searching.

Query: {query}

A query needs clarification if it's:
- Missing critical context (which country? which year? which person/company?)
- Ambiguous timeframe when recent events matter ("latest", "recent", "current" without specifying when)
- Vague references ("the election", "the CEO", "the product" without naming which one)

Examples that NEED clarification:
- "Who won the presidential election?" → Need to know which country and year
- "When will the product launch?" → Need to know which product
- "What's the latest on the trial?" → Need to know which trial
- "Is the CEO resigning?" → Need to know which company

Examples that DON'T need clarification:
- "Who won the 2024 US presidential election?" → Specific
- "What's happening with the Mars rover mission?" → Specific enough
- "When will the iPhone 16 launch?" → Specific product

Respond in JSON format:
{{
  "needs_clarification": true/false,
  "reason": "brief explanation",
  "clarification_questions": ["question1", "question2"] // only if needs_clarification is true
}}

Respond with ONLY the JSON object."""
        
        messages = [
            {"role": "user", "content": clarification_prompt}
        ]
        
        try:
            response_text = call_perplexity(messages, model="sonar")
            # Extract JSON from response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = response_text[start_idx:end_idx]
                result = json.loads(json_str)
                return result
            return {"needs_clarification": False}
        except Exception as e:
            print(f"Error checking clarification: {str(e)}")
            return {"needs_clarification": False}
    
    def search_with_ai(self, query: str) -> str:
        """Perform a web search using Perplexity AI."""
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
- Questions about WHY something happened (explanations for past events)
- Questions about WHO won/did something if the answer is already known
- Questions about WHEN something happened if it already occurred
- Product launches, releases, or announcements that already happened
- Any situation where the core question has a definitive answer, even if minor details might still emerge

"In Progress" - ONLY choose this if:
- A significant, ongoing process with major milestones still expected
- Future events that haven't occurred yet (upcoming elections, product launches not yet happened)
- Active investigations/trials WITHOUT a final verdict/conclusion
- Developing situations where the PRIMARY question remains unanswered
- Breaking news that is actively unfolding RIGHT NOW with major updates expected

Critical Examples:
- "Who won the 2024 US presidential election?" → Completed (winner is known, election concluded)
- "Who won the most recent presidential election in [country]?" → Completed (if winner declared)
- "Will X win the 2028 election?" → In Progress (future event)
- "What was the verdict in X trial?" → Completed (if verdict reached)
- "What will happen in the ongoing X trial?" → In Progress (if trial still active, no verdict)
- "Why did X happen?" → Completed (asking for explanation of past event)
- "When will Y be released?" → In Progress (if not yet released)
- "When was Y released?" → Completed (already happened)
- "Who is the current CEO of X?" → Completed (this is a factual lookup, not a developing story)
- "Will the CEO resign?" → In Progress (future uncertainty)

Important: If the search result contains a clear, definitive answer to the user's question, mark it as "Completed" even if there might be minor follow-up details or commentary still emerging. Only mark "In Progress" if there are substantial, significant developments still expected that would fundamentally change the answer.

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
        """Generate a tracking plan proposal based on the user's prompt."""
        plan_prompt = f"""Based on this user query and search result, create a tracking plan in JSON format:

User Query: {user_prompt}
Search Result: {search_result}

Generate a JSON object with:
- topic: A concise description of what to track
- objective: What significant developments to watch for
- frequency_hours: Recommended search frequency (4, 12, or 24 hours)
- keywords: List of 3-5 important keywords to detect in updates

Example: {{"topic": "Investigation of XYZ case", "objective": "Detect arrest, trial start, or verdict", "frequency_hours": 12, "keywords": ["arrest", "charged", "trial", "verdict", "suspect identified"]}}

Respond with ONLY the JSON object, no additional text."""
        
        messages = [
            {"role": "user", "content": plan_prompt}
        ]
        
        try:
            response_text = call_perplexity(messages, model="sonar")
            # Extract JSON from response (in case there's extra text)
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = response_text[start_idx:end_idx]
                plan_data = json.loads(json_str)
            else:
                plan_data = json.loads(response_text)
                
            return TrackingPlan(
                topic=plan_data['topic'],
                objective=plan_data['objective'],
                frequency_hours=plan_data['frequency_hours'],
                keywords=plan_data['keywords']
            )
        except Exception as e:
            print(f"Error generating tracking plan: {str(e)}")
            return TrackingPlan(
                topic=user_prompt,
                objective="Track for significant updates",
                frequency_hours=12,
                keywords=["update", "news", "announced", "confirmed", "reported"]
            )
    
    def detect_differences(self, old_result: str, new_result: str, keywords: List[str]) -> Optional[str]:
        """Compare search results and detect meaningful differences."""
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
    
    def start_tracking(self, plan: TrackingPlan):
        """Add a tracking plan to active tracking."""
        self.tracking_plans[plan.id] = plan
        plan.active = True
        plan.status = "tracking"
        plan.next_search_time = datetime.now() + timedelta(hours=plan.frequency_hours)
        self.save_tracking_plans()
    
    def check_tracking_updates(self):
        """Check all active tracking plans for updates."""
        now = datetime.now()
        updates_found = []
        
        for plan_id, plan in self.tracking_plans.items():
            if not plan.active:
                continue
            
            if plan.next_search_time and now >= plan.next_search_time:
                # Perform new search
                new_result = self.search_with_ai(plan.topic)
                
                # Compare with previous result
                if plan.last_search_result:
                    update = self.detect_differences(
                        plan.last_search_result,
                        new_result,
                        plan.keywords
                    )
                    
                    if update:
                        update_entry = {
                            'timestamp': now.isoformat(),
                            'update': update
                        }
                        plan.updates.append(update_entry)
                        updates_found.append({
                            'plan_id': plan_id,
                            'topic': plan.topic,
                            'update': update
                        })
                
                # Update tracking plan
                plan.last_search_result = new_result
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
                        plan = TrackingPlan(
                            topic=plan_dict['topic'],
                            objective=plan_dict['objective'],
                            frequency_hours=plan_dict['frequency_hours'],
                            keywords=plan_dict['keywords'],
                            status=plan_dict.get('status', 'tracking')
                        )
                        plan.id = plan_dict['id']
                        plan.last_search_result = plan_dict['last_search_result']
                        plan.active = plan_dict['active']
                        plan.updates = plan_dict.get('updates', [])
                        plan.original_query = plan_dict.get('original_query', '')
                        plan.clarification_info = plan_dict.get('clarification_info')
                        
                        if plan_dict['last_search_time']:
                            plan.last_search_time = datetime.fromisoformat(plan_dict['last_search_time'])
                        if plan_dict['next_search_time']:
                            plan.next_search_time = datetime.fromisoformat(plan_dict['next_search_time'])
                        if plan_dict['created_at']:
                            plan.created_at = datetime.fromisoformat(plan_dict['created_at'])
                        
                        self.tracking_plans[plan_id] = plan
            except Exception as e:
                print(f"Error loading tracking plans: {str(e)}")

# Initialize tracker
tracker = BurilarTracker()

# REST API Endpoints

@app.route('/')
def index():
    """Serve the main web interface."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files or fallback to index.html for SPA routing."""
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/search', methods=['POST'])
def initial_search():
    """Perform initial search and assess topic status."""
    data = request.json
    query = data.get('query')
    
    if not query:
        return jsonify({'error': 'Query is required'}), 400
    
    # First, check if query needs clarification
    clarification_check = tracker.check_needs_clarification(query)
    
    if clarification_check.get('needs_clarification'):
        # Save this as a plan with "needs_clarification" status
        plan = TrackingPlan(
            topic=query,
            objective="Needs clarification",
            frequency_hours=12,
            keywords=[],
            status="needs_clarification"
        )
        plan.original_query = query
        plan.clarification_info = {
            'reason': clarification_check.get('reason', 'Query is ambiguous'),
            'questions': clarification_check.get('clarification_questions', [])
        }
        tracker.tracking_plans[plan.id] = plan
        tracker.save_tracking_plans()
        
        return jsonify({
            'query': query,
            'plan_id': plan.id,
            'needs_clarification': True,
            'reason': clarification_check.get('reason', 'Query is ambiguous'),
            'clarification_questions': clarification_check.get('clarification_questions', [])
        })
    
    # Perform initial search
    search_result = tracker.search_with_ai(query)
    
    # Assess status
    status_info = tracker.assess_topic_status(search_result)
    
    response = {
        'query': query,
        'needs_clarification': False,
        'search_result': search_result,
        'status': status_info['status'],
        'status_explanation': status_info['explanation']
    }
    
    # Create and save plan regardless of status
    if status_info['status'] == 'in_progress':
        plan = tracker.generate_tracking_plan(query, search_result)
        plan.last_search_result = search_result
        plan.status = "pending"  # Waiting for user to start tracking
        plan.original_query = query
        response['proposed_plan'] = {
            'topic': plan.topic,
            'objective': plan.objective,
            'frequency_hours': plan.frequency_hours,
            'keywords': plan.keywords,
            'plan_id': plan.id
        }
    else:
        # Status is "completed" - save as a completed search
        plan = TrackingPlan(
            topic=query,
            objective="Query resolved",
            frequency_hours=12,
            keywords=[],
            status="completed"
        )
        plan.last_search_result = search_result
        plan.original_query = query
        response['plan_id'] = plan.id
    
    # Store the plan
    tracker.tracking_plans[plan.id] = plan
    tracker.save_tracking_plans()
    
    return jsonify(response)

@app.route('/api/tracking/start', methods=['POST'])
def start_tracking():
    """Start tracking a plan."""
    data = request.json
    plan_id = data.get('plan_id')
    frequency_hours = data.get('frequency_hours')
    
    if not plan_id or plan_id not in tracker.tracking_plans:
        return jsonify({'error': 'Invalid plan_id'}), 400
    
    plan = tracker.tracking_plans[plan_id]
    
    # Update frequency if provided
    if frequency_hours:
        plan.frequency_hours = frequency_hours
    
    tracker.start_tracking(plan)
    
    return jsonify({
        'message': 'Tracking started',
        'plan': plan.to_dict()
    })

@app.route('/api/tracking/list', methods=['GET'])
def list_tracking():
    """List all tracking plans (active and inactive)."""
    plans = [plan.to_dict() for plan in tracker.tracking_plans.values()]
    return jsonify({'plans': plans})

@app.route('/api/tracking/<plan_id>', methods=['GET'])
def get_tracking_plan(plan_id):
    """Get details of a specific tracking plan."""
    if plan_id not in tracker.tracking_plans:
        return jsonify({'error': 'Plan not found'}), 404
    
    plan = tracker.tracking_plans[plan_id]
    return jsonify(plan.to_dict())

@app.route('/api/tracking/<plan_id>/stop', methods=['POST'])
def stop_tracking(plan_id):
    """Stop tracking a plan."""
    if plan_id not in tracker.tracking_plans:
        return jsonify({'error': 'Plan not found'}), 404
    
    tracker.tracking_plans[plan_id].active = False
    tracker.save_tracking_plans()
    
    return jsonify({'message': 'Tracking stopped'})

@app.route('/api/tracking/<plan_id>/delete', methods=['DELETE'])
def delete_tracking(plan_id):
    """Delete a tracking plan."""
    if plan_id not in tracker.tracking_plans:
        return jsonify({'error': 'Plan not found'}), 404
    
    del tracker.tracking_plans[plan_id]
    tracker.save_tracking_plans()
    
    return jsonify({'message': 'Tracking plan deleted'})

@app.route('/api/tracking/check', methods=['POST'])
def check_updates():
    """Manually check for updates on all active tracking plans."""
    updates = tracker.check_tracking_updates()
    return jsonify({'updates': updates})

# Background thread to check for updates periodically
def background_checker():
    while True:
        time.sleep(300)  # Check every 5 minutes
        tracker.check_tracking_updates()

# Start background thread
checker_thread = threading.Thread(target=background_checker, daemon=True)
checker_thread.start()

if __name__ == '__main__':
    # Use stat reloader instead of watchdog to avoid watching site-packages
    app.run(debug=True, port=5050, use_reloader=True, reloader_type='stat')