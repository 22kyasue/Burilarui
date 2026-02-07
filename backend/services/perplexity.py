import os
import requests
from typing import Dict, List, Union, Literal, overload

# Perplexity API configuration
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY", "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")
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

@overload
def call_perplexity(messages: List[Dict], model: str = "sonar", return_images: Literal[False] = False) -> str: ...

@overload
def call_perplexity(messages: List[Dict], model: str = "sonar", return_images: Literal[True] = True) -> Dict: ...

@overload
def call_perplexity(messages: List[Dict], model: str = "sonar", return_images: bool = False) -> Union[str, Dict]: ...

def call_perplexity(messages: List[Dict], model: str = "sonar", return_images: bool = False) -> Union[str, Dict]:
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
        "return_citations": True,
        "return_images": return_images or False
    }

    try:
        response = requests.post(PERPLEXITY_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()

        # Extract the main content
        content = result['choices'][0]['message']['content']
        images = result['choices'][0]['message'].get('images', [])

        # Try to append citations if available
        if 'citations' in result and result['citations']:
            content += "\n\n**Sources:**\n"
            for i, citation in enumerate(result['citations'], 1):
                content += f"[{i}] {citation}\n"

        if return_images:
            return {"content": content, "images": images}

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
