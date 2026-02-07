
import json
import uuid
from datetime import datetime

DATA_FILE = "burilar_tracking_data.json"

def create_rich_update():
    return {
        "timestamp": datetime.now().isoformat(),
        "update": "Significant market changes detected in AI sector.",
        "details": {
            "summary": "AI sector shows 15% growth in Q3 with major announcements from key players.",
            "changes": [
                "NVIDIA announced new chip architecture.",
                "OpenAI released updated model pricing.",
                "Regulatory bodies in EU proposed new AI guidelines."
            ],
            "sources": [
                {"id": "1", "title": "TechCrunch AI Report", "url": "https://techcrunch.com/ai"},
                {"id": "2", "title": "Reuters Technology", "url": "https://reuters.com/technology"}
            ]
        },
        "data": {"value": 150}
    }

def main():
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"{DATA_FILE} not found. Creating new data store.")
        data = {}

    # Find a plan or create one
    plan_id = None
    if data:
        plan_id = list(data.keys())[0]
        print(f"Using existing plan: {plan_id}")
    else:
        plan_id = str(uuid.uuid4())
        print(f"Creating new plan: {plan_id}")
        data[plan_id] = {
            "id": plan_id,
            "topic": "Artificial Intelligence Trends",
            "objective": "Track AI developments",
            "frequency_hours": 24,
            "status": "tracking",
            "active": True,
            "created_at": datetime.now().isoformat(),
            "updates": []
        }

    # Add update
    if "updates" not in data[plan_id]:
        data[plan_id]["updates"] = []
    
    update = create_rich_update()
    data[plan_id]["updates"].append(update)
    
    # Save
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Successfully injected rich update into plan {plan_id}")

if __name__ == "__main__":
    main()
