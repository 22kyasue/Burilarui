from datetime import datetime
from typing import List, Dict, Optional
import time

class TrackingPlan:
    """Represents a tracking plan for a specific topic."""
    def __init__(self, topic: str, objective: str, frequency_hours: int, keywords: List[str], status: str = "pending", user_id: str = None, strategy: Optional[Dict] = None):
        self.id = str(int(time.time() * 1000))
        self.user_id = user_id  # Owner of this tracking plan
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
        self.suggested_prompt = ""
        self.image_url = ""
        self.strategy = strategy if strategy is not None else {}

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
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
            'clarification_info': self.clarification_info,
            'suggested_prompt': getattr(self, 'suggested_prompt', ""),
            'image_url': getattr(self, 'image_url', ""),
            'strategy': self.strategy
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'TrackingPlan':
        plan = cls(
            topic=data['topic'],
            objective=data['objective'],
            frequency_hours=data['frequency_hours'],
            keywords=data['keywords'],
            status=data.get('status', 'tracking'),
            user_id=data.get('user_id'),
            strategy=data.get('strategy') # Add strategy here
        )
        plan.id = data['id']
        plan.last_search_result = data.get('last_search_result', "")
        plan.active = data.get('active', False)
        plan.updates = data.get('updates', [])
        plan.original_query = data.get('original_query', '')
        plan.clarification_info = data.get('clarification_info')
        plan.suggested_prompt = data.get('suggested_prompt', '')
        plan.image_url = data.get('image_url', '')
        # plan.strategy is already set in __init__ if passed, otherwise it's {}

        if data.get('last_search_time'):
            plan.last_search_time = datetime.fromisoformat(data['last_search_time'])
        if data.get('next_search_time'):
            plan.next_search_time = datetime.fromisoformat(data['next_search_time'])
        if data.get('created_at'):
            plan.created_at = datetime.fromisoformat(data['created_at'])
            
        return plan
