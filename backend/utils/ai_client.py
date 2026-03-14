"""
Unified AI client.

Routing logic:
  task="generation"  → Gemini  (strategy, analysis, extraction, chat, refinement)
  task="web_search"  → Gemini now; Perplexity once PERPLEXITY_API_KEY is set

When PERPLEXITY_API_KEY is present, web_search tasks automatically route to
Perplexity (sonar) with Gemini as fallback.
"""

import logging
import os
import time
import requests
from typing import Dict, List, Union

logger = logging.getLogger(__name__)

# ── Gemini ─────────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)
GEMINI_DEFAULT_MODEL = "gemini-2.5-flash"

# ── Perplexity ──────────────────────────────────────────────────────────────────
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY", "")
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"


# ── Error class ────────────────────────────────────────────────────────────────
class AIClientError(Exception):
    def __init__(self, provider: str, message: str, status_code: int = None):
        self.provider = provider
        self.status_code = status_code
        super().__init__(f"[{provider}] {message}")


# ── Internal helpers ───────────────────────────────────────────────────────────
def _convert_to_gemini_format(messages: List[Dict]):
    """
    Convert OpenAI-style messages to Gemini REST format.
    Returns (system_instruction_text, contents_list).
    """
    system_instruction = None
    contents = []

    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        if role == "system":
            # Gemini accepts a top-level systemInstruction
            system_instruction = content
        elif role == "assistant":
            contents.append({"role": "model", "parts": [{"text": content}]})
        else:
            contents.append({"role": "user", "parts": [{"text": content}]})

    # Gemini requires the conversation to start with a user turn
    if not contents:
        contents = [{"role": "user", "parts": [{"text": system_instruction or "Hello"}]}]
        system_instruction = None

    return system_instruction, contents


# ── Gemini ─────────────────────────────────────────────────────────────────────
def call_gemini(messages: List[Dict], model: str = GEMINI_DEFAULT_MODEL) -> str:
    """
    Call Google Gemini via REST API.
    Returns plain text response string.
    Raises AIClientError on failure.
    """
    if not GEMINI_API_KEY:
        raise AIClientError("gemini", "GEMINI_API_KEY not set")

    system_instruction, contents = _convert_to_gemini_format(messages)

    payload: Dict = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 4000,
        },
    }
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    url = GEMINI_API_URL.format(model=model)
    params = {"key": GEMINI_API_KEY}

    try:
        response = requests.post(url, json=payload, params=params, timeout=60)
        response.raise_for_status()
        result = response.json()

        candidates = result.get("candidates", [])
        if not candidates:
            raise AIClientError("gemini", "No candidates returned in response")

        finish_reason = candidates[0].get("finishReason", "")
        if finish_reason == "SAFETY":
            raise AIClientError("gemini", "Response blocked by safety filters")

        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(p.get("text", "") for p in parts)
        return text

    except requests.exceptions.Timeout:
        raise AIClientError("gemini", "Request timed out after 60s")
    except requests.exceptions.HTTPError as e:
        try:
            error_detail = response.json()
            raise AIClientError("gemini", str(error_detail), response.status_code)
        except AIClientError:
            raise
        except Exception:
            raise AIClientError("gemini", str(e))
    except AIClientError:
        raise
    except Exception as e:
        raise AIClientError("gemini", str(e))


# ── Perplexity ──────────────────────────────────────────────────────────────────
def call_perplexity(
    messages: List[Dict],
    model: str = "sonar",
    return_images: bool = False,
) -> Union[str, Dict]:
    """
    Call Perplexity API.
    Returns plain text, or dict {"content", "images", "citations"} when return_images=True.
    Raises AIClientError on failure.
    """
    if not PERPLEXITY_API_KEY:
        raise AIClientError("perplexity", "PERPLEXITY_API_KEY not set")

    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 4000,
        "return_citations": True,
        "return_images": return_images,
    }

    try:
        response = requests.post(
            PERPLEXITY_API_URL, json=payload, headers=headers, timeout=60
        )
        response.raise_for_status()
        result = response.json()

        content = result["choices"][0]["message"]["content"]
        images = result["choices"][0]["message"].get("images", [])

        if result.get("citations"):
            content += "\n\n**Sources:**\n"
            for i, citation in enumerate(result["citations"], 1):
                content += f"[{i}] {citation}\n"

        if return_images:
            return {
                "content": content,
                "images": images,
                "citations": result.get("citations", []),
            }
        return content

    except requests.exceptions.Timeout:
        raise AIClientError("perplexity", "Request timed out after 60s")
    except requests.exceptions.HTTPError as e:
        try:
            error_detail = response.json()
            raise AIClientError("perplexity", str(error_detail), response.status_code)
        except AIClientError:
            raise
        except Exception:
            raise AIClientError("perplexity", str(e))
    except AIClientError:
        raise
    except Exception as e:
        raise AIClientError("perplexity", str(e))


# ── Unified entry point ────────────────────────────────────────────────────────
def call_ai(
    messages: List[Dict],
    task: str = "generation",
    return_images: bool = False,
) -> Union[str, Dict]:
    """
    Unified AI caller. All backend services should use this.

    task="generation"  → Gemini  (analysis, strategy, extraction, chat)
    task="web_search"  → Perplexity (sonar) with Gemini fallback

    return_images=True → returns {"content": str, "images": list, "citations": list}
    """
    start = time.time()

    # ── web_search via Perplexity ────────────────────────────────────────────────
    if task == "web_search" and PERPLEXITY_API_KEY:
        try:
            result = call_perplexity(messages, model="sonar", return_images=return_images)
            logger.info("web_search via Perplexity (%.1fs)", time.time() - start)
            return result
        except AIClientError as e:
            logger.warning("Perplexity failed (%s), falling back to Gemini", e)

    # ── all tasks: Gemini ──────────────────────────────────────────────────────
    try:
        text = call_gemini(messages)
        logger.info("%s via Gemini (%.1fs)", task, time.time() - start)
        if return_images:
            return {"content": text, "images": [], "citations": []}
        return text

    except AIClientError as e:
        logger.error("Gemini failed: %s", e)
        error_msg = f"AI service temporarily unavailable. Please try again."
        if return_images:
            return {"content": error_msg, "images": [], "citations": []}
        return error_msg
