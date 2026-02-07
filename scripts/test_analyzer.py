import sys
import os
import json

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.analyzer import TrackingAnalyzer

def test_analyzer():
    analyzer = TrackingAnalyzer()
    
    test_queries = [
        "When is the iPhone 16 release date?",
        "Who won the 2024 US election?", 
        "Track the price of Bitcoin",
        "What's happening with OpenAI?",
        "Election results"
    ]
    
    print("=== Testing TrackingAnalyzer ===\n")

    # NEW: Test Context Resolution
    print("--- Testing Context Resolution ---")
    mock_history = [
        {"role": "user", "content": "Tell me about the Apple Vision Pro"},
        {"role": "assistant", "content": "The Apple Vision Pro is a spatial computer..."}
    ]
    context_query = "track it"
    print(f"History Context: Apple Vision Pro conversation")
    print(f"Query: {context_query}")
    resolved = analyzer.resolve_context(context_query, mock_history)
    print(f"Resolved: {resolved}")
    print("-" * 50)

    # NEW: Test Source Probe
    print("--- Testing Source Probe ---")
    fake_query = "Project QuibbleWobble 2029 release date" # Detailed fake name
    print(f"Query: {fake_query}")
    probe = analyzer.probe_sources(fake_query)
    print(f"Available: {probe.get('available')} ({probe.get('reason')})")
    print("-" * 50)
    
    for query in test_queries:
        print(f"Query: {query}")
        
        # 1. Intent
        print("Analyzing Intent...")
        intent = analyzer.analyze_intent(query)
        print(f"Intent: {intent.get('category')} (Confidence: {intent.get('confidence')})")
        
        # 2. Feasibility
        print("Checking Feasibility...")
        feasibility = analyzer.check_feasibility(query)
        print(f"Feasible: {feasibility.get('is_feasible')} ({feasibility.get('reason')})")
        
        # 3. Ambiguity
        print("Checking Ambiguity...")
        ambiguity = analyzer.resolve_ambiguity(query)
        if ambiguity.get('is_ambiguous'):
            print(f"Ambiguous: Yes. Interpretations: {len(ambiguity.get('interpretations', []))}")
        else:
            print("Ambiguous: No")
            
        print("-" * 50)

if __name__ == "__main__":
    test_analyzer()
