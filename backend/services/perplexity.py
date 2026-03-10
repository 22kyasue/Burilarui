import os
import time
import requests
from typing import Dict, List, Union, Literal, overload

# Perplexity API configuration
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"


def _ensure_api_key():
    """Raise error if API key is not configured."""
    global PERPLEXITY_API_KEY
    if not PERPLEXITY_API_KEY:
        # Re-check env in case it was set after module load
        PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
    if not PERPLEXITY_API_KEY:
        raise ValueError(
            "PERPLEXITY_API_KEY environment variable is not set. "
            "Add it to your .env file or export it in your shell."
        )


@overload
def call_perplexity(messages: List[Dict], model: str = "sonar", return_images: Literal[False] = False) -> str: ...

@overload
def call_perplexity(messages: List[Dict], model: str = "sonar", return_images: Literal[True] = True) -> Dict: ...

@overload
def call_perplexity(messages: List[Dict], model: str = "sonar", return_images: bool = False) -> Union[str, Dict]: ...

def call_perplexity(messages: List[Dict], model: str = "sonar", return_images: bool = False) -> Union[str, Dict]:
    """Make a request to Perplexity API with 1 retry on server errors."""
    _ensure_api_key()

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

    last_error = None
    for attempt in range(2):  # 1 initial + 1 retry
        try:
            response = requests.post(PERPLEXITY_API_URL, json=payload, headers=headers)

            # Retry on 5xx
            if response.status_code >= 500 and attempt == 0:
                time.sleep(2)
                continue

            response.raise_for_status()
            result = response.json()

            # Extract the main content
            content = result['choices'][0]['message']['content']
            images = result['choices'][0]['message'].get('images', [])

            # Append citations if available
            if 'citations' in result and result['citations']:
                content += "\n\n**Sources:**\n"
                for i, citation in enumerate(result['citations'], 1):
                    content += f"[{i}] {citation}\n"

            if return_images:
                return {
                    "content": content,
                    "images": images,
                    "citations": result.get('citations', [])
                }

            return content

        except requests.exceptions.HTTPError as e:
            try:
                error_detail = response.json()
                last_error = f"Perplexity API Error: {error_detail}"
            except Exception:
                last_error = f"Perplexity API Error: {str(e)}"
            print(last_error)
        except Exception as e:
            last_error = f"Error calling Perplexity API: {str(e)}"
            print(last_error)

        # Only retry on first attempt
        if attempt == 0:
            time.sleep(2)

    return f"Error: {last_error}" if last_error else "Error: Unknown error calling Perplexity API"
