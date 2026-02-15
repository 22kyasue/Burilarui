# Update Panel UI Corrections Log
Wrote on: 2026-02-15

## Summary of Changes
Refined the `Unread Updates` panel UI to be more concise and visually aligned with the requested "Badge" style.

### 1. Structure Changes
*   **Removed**: The "Unread Updates" statistics section (graph/count) at the top of the panel has been completely removed to reduce visual clutter.
*   **Simplified List Items**: Bullet points and source lists are now hidden in the main list view.
*   **Truncation**: Notification summaries are now truncated to a maximum of 2 lines. Full details are only shown when clicking "詳細を見る" (View Details).

### 2. Style & Layout Operations
*   **Badge Style Title**:
    *   The update title (e.g., "Update #1") is now styled as a small, rounded capsule (badge) instead of plain text.
    *   Added a purple "NEW" badge to the left of the title for visual emphasis.
*   **Top Alignment**:
    *   Moved the title/badge row to the very top of the card.
    *   The timestamp is aligned to the right of this top row.
*   **Color Adjustments**:
    *   Badges use `indigo-500` (purple) for "NEW" and neutral gray for the title background to distinguish hierarchy.

## Files Modified
*   `src/components/UpdatePanel.tsx`
