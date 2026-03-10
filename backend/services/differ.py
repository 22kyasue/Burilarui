"""
Update Differ
Compares old and new tracking data to detect meaningful updates.
Extracted from BurilarTracker._detect_structured_diff and detect_differences.
"""

from typing import Dict, List, Optional
from backend.services.perplexity import call_perplexity


class UpdateDiffer:
    """Detects meaningful differences between old and new tracking results."""

    def detect_structured_diff(self, old_data: Dict, new_data: Dict, schema_type: str) -> Optional[Dict]:
        """
        Compare two structured JSON objects.
        Returns an update object if meaningful change found, else None.
        Structure: { "summary": str, "changes": List[str], "sources": List[Dict] }
        """
        if not old_data or not new_data:
            return None

        changes = []
        summary = ""

        if schema_type == "release_watch":
            if old_data.get("status") != new_data.get("status"):
                changes.append(
                    f"Status changed from {old_data.get('status')} to {new_data.get('status')}"
                )
            if old_data.get("date") != new_data.get("date"):
                changes.append(
                    f"Release date updated from {old_data.get('date')} to {new_data.get('date')}"
                )
            if changes:
                summary = "Release information has been updated."

        elif schema_type == "metric_tracking":
            try:
                old_val = float(old_data.get("value", 0))
                new_val = float(new_data.get("value", 0))
                if old_val != 0:
                    pct_change = abs((new_val - old_val) / old_val)
                    if pct_change > 0.05:  # 5% threshold
                        direction = "up" if new_val > old_val else "down"
                        changes.append(
                            f"Value moved {direction} by {pct_change:.1%} ({old_val} -> {new_val})"
                        )
                        summary = f"Significant value change detected ({direction} {pct_change:.1%})."
            except (ValueError, TypeError):
                pass

        # Fallback: check summary text difference
        if not changes and old_data.get("latest_update_summary") != new_data.get("latest_update_summary"):
            diff_text = self.detect_text_diff(str(old_data), str(new_data), [])
            if diff_text:
                summary = diff_text
                changes.append("General update detected in summary.")

        if summary or changes:
            return {
                "summary": summary if summary else "New updates detected.",
                "changes": changes,
                "sources": new_data.get("sources", []),
            }

        return None

    def detect_text_diff(self, old_text: str, new_text: str, keywords: List[str]) -> Optional[str]:
        """
        Compare two text results using LLM to identify significant new developments.
        Returns a summary string if updates found, else None.
        """
        diff_prompt = f"""Compare these two search results and identify if there are SIGNIFICANT new developments.

Previous Result:
{old_text[:1000]}

New Result:
{new_text[:1000]}

Important Keywords to Watch: {', '.join(keywords)}

If there are meaningful updates (new facts, events, or milestones), respond with "UPDATE:" followed by a summary.
If there are no significant changes, respond with only "NO_CHANGE"."""

        messages = [{"role": "user", "content": diff_prompt}]

        result = call_perplexity(messages, model="sonar")

        if isinstance(result, str) and result.startswith("UPDATE:"):
            return result.replace("UPDATE:", "").strip()
        return None
