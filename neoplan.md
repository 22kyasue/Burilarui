# Burilar Neo Plan: Full Restructure (Backend to Frontend)

## Current Problems

### Backend
1. **God object**: `BurilarTracker` (494 lines) handles query processing, searching, diffing, tracking, feedback, and file I/O
2. **Two notification systems**: Disabled `notifications_bp` blueprint AND `NotificationManager` in `tracker.notifier` doing the same thing through different storage
3. **Two storage systems**: Tracking plans use a custom JSON file (`burilar_tracking_data.json`), while users/chats use `JSONFileStorage`. Notifications have BOTH — `data/notifications.json` (blueprint) and `burilar_notifications.json` (NotificationManager)
4. **Duplicate Perplexity wrapper**: `backend/services/perplexity.py` and `backend/utils/ai.py` are near-identical copies, both with hardcoded API keys
5. **Monolith API file**: `burilar_api.py` has tracking/search/notification routes inline instead of in blueprints
6. **Bad REST design**: `/api/tracking/<id>/stop` (should be PATCH), `/api/tracking/<id>/delete` (should be DELETE on `/api/tracking/<id>`)
7. **Overloaded endpoints**: `/api/search` creates tracking plans, assesses status, AND returns search results in one call
8. **`auth_optional` everywhere**: Tracking routes allow unauthenticated access with fragile user_id-or-None branching
9. **Background thread**: Bare `threading.Thread` with `time.sleep(300)` — no error handling, no graceful shutdown

### Frontend
1. **Massive disconnect**: Frontend types (`src/types/tracking.ts`) define clean REST endpoints (`/trackings`, PATCH, etc.) that don't exist on the backend
2. **Hardcoded demo data**: `useTracking` hook has hardcoded Japanese demo data, not connected to any API
3. **Figma-exported components**: Rigid, hard to modify, lots of inline styles and magic values
4. **Duplicate type files**: `src/types/notification.ts` AND `src/types/notifications.ts`
5. **Dead code**: `src/data/demoData.ts`, `src/data/demoScenarios.ts`, unused components

---

## Key Design Decisions

### 1. Chat feature: DROP for now
Chat and tracking are separate systems that don't connect. The chat route (`chats.py:add_message`) calls Perplexity directly, bypassing the tracker pipeline entirely. The tracking creation flow itself is conversational (search -> clarify -> confirm -> track), which replaces the need for a separate chat. We can add chat back later if needed.

### 2. Storage: Stay with JSON files
SQLite would be better, but switching storage backends mid-restructure adds risk. The `JSONFileStorage` base class has a clean abstract interface (`BaseStorage`), so migrating to SQLite later is a swap, not a rewrite.

### 3. `TrackingPlan` model class: DROP
With `TrackingStorage` using dicts (like `ChatStorage` and `UserStorage`), the `TrackingPlan` class becomes unnecessary overhead. The tracker will work with dicts directly. The model's `to_dict()`/`from_dict()` methods were just serialization boilerplate for the custom JSON file — `JSONFileStorage` handles that.

### 4. Tracker instance: Singleton pattern
`BurilarTracker` becomes a singleton created once in `burilar_api.py` and injected into the trackings blueprint via Flask's `app.config` or `g`. No circular imports, no duplicate instances.

### 5. Search vs Track: Two separate endpoints
`POST /api/search` — one-shot search, returns results, no tracking created.
`POST /api/trackings` — creates a tracking from a query OR a previous search result.
This avoids the "overloaded endpoint" problem.

### 6. Clarification flow: Stateless
If a query needs clarification, the response includes questions. The frontend re-submits with the clarified query — no server-side "pending clarification" state to manage. Clean and simple.

---

## What We Keep (Do Not Rewrite)

### Backend — Service Layer
- `backend/services/analyzer.py` — Intent analysis, feasibility, ambiguity resolution
- `backend/services/architect.py` — Strategy generation, query planning
- `backend/services/executor.py` — Search execution, result aggregation
- `backend/services/extractor.py` — Structured data extraction from search results
- `backend/services/perplexity.py` — Perplexity API wrapper (fix hardcoded key)
- `backend/storage/base.py` — `JSONFileStorage` base class
- `backend/storage/users.py` — `UserStorage`
- `backend/utils/auth.py` — JWT token utilities
- `backend/middleware/auth.py` — Auth decorators (drop `auth_optional`)

### Frontend — Infrastructure
- `src/api/client.ts` — Fetch wrapper with auth headers, error handling
- `src/api/types.ts` — Base API types (ApiResponse, ApiError, etc.)
- `src/components/ui/*` — All shadcn/ui components
- `src/context/AuthContext.tsx` — Auth state management
- `src/components/AuthGuard.tsx` — Auth guard wrapper

---

## Phase 1: Backend — Unify Storage

**Goal**: Single consistent storage layer. All data in `data/` directory via `JSONFileStorage`.

### Step 1.1: Create `TrackingStorage`

File: `backend/storage/trackings.py`

```python
class TrackingStorage(JSONFileStorage):
    def __init__(self): super().__init__(data/trackings.json)
    def get_by_user(user_id) -> List[Dict]
    def get_user_tracking(user_id, tracking_id) -> Optional[Dict]
    def get_active_trackings() -> List[Dict]           # For background checker
    def create_tracking(user_id, data) -> Dict
    def update_tracking(user_id, tracking_id, data) -> Optional[Dict]
    def delete_tracking(user_id, tracking_id) -> bool
    def add_update(user_id, tracking_id, update_data) -> Optional[Dict]
    def mark_updates_read(user_id, tracking_id, update_ids) -> int
    def mark_all_updates_read(user_id, tracking_id) -> int

tracking_storage = TrackingStorage()  # Singleton
```

Data shape in `data/trackings.json` (each item):
```json
{
  "id": "...",
  "user_id": "...",
  "title": "Apple Intelligence 2025",
  "query": "Track Apple Intelligence developments",
  "description": "Monitoring AI features across Apple ecosystem",
  "is_active": true,
  "is_pinned": false,
  "frequency": "daily",
  "custom_frequency_hours": null,
  "notification_enabled": true,
  "status": "tracking",
  "strategy": {},
  "keywords": [],
  "last_search_result": {},
  "last_executed_at": null,
  "next_execute_at": null,
  "image_url": "",
  "update_count": 0,
  "unread_count": 0,
  "updates": [],
  "created_at": "...",
  "updated_at": "..."
}
```

### Step 1.2: Create `NotificationStorage`

File: `backend/storage/notifications.py`

```python
class NotificationStorage(JSONFileStorage):
    def __init__(self): super().__init__(data/notifications.json)
    def get_by_user(user_id, unread_only=False, limit=50, offset=0) -> List[Dict]
    def get_unread_count(user_id) -> int
    def create_notification(user_id, data) -> Dict
    def mark_read(user_id, notification_id) -> bool
    def mark_all_read(user_id) -> int
    def delete_notification(user_id, notification_id) -> bool
    def submit_feedback(user_id, notification_id, feedback) -> bool
    def get_feedback_summary(tracking_id) -> Dict

notification_storage = NotificationStorage()  # Singleton
```

Note: `data/notifications.json` already exists from the old disabled blueprint. The new `NotificationStorage` will use it directly. Data from `burilar_notifications.json` (the NotificationManager file) needs to be merged in during migration.

### Step 1.3: Update `backend/storage/__init__.py`
```python
from .users import user_storage
from .chats import chat_storage
from .trackings import tracking_storage
from .notifications import notification_storage
```

### Step 1.4: Migration script

File: `scripts/migrate_storage.py`

- Read `burilar_tracking_data.json` -> map old `TrackingPlan` fields to new schema -> write to `data/trackings.json`
- Read `burilar_notifications.json` -> merge with existing `data/notifications.json` (dedup by id) -> write back
- Field mapping: `topic` -> `title`, `active` -> `is_active`, `frequency_hours` -> calculate `frequency` enum + `custom_frequency_hours`, `original_query` -> `query`
- Print summary of migrated records

---

## Phase 2: Backend — Refactor Core

**Goal**: Slim tracker, no duplicate code, single Perplexity wrapper.

### Step 2.1: Delete duplicates
- Delete `backend/utils/ai.py` (duplicate of `backend/services/perplexity.py`)
- Update `backend/routes/chats.py` line 2: change `from backend.utils.ai import call_perplexity` to `from backend.services.perplexity import call_perplexity`

### Step 2.2: Fix `backend/services/perplexity.py`
- Remove hardcoded API key fallback
- `PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")` — no default
- Raise `ValueError("PERPLEXITY_API_KEY not set")` on first call if missing
- Add basic retry (1 retry on 5xx with 2s delay)

### Step 2.3: Update `.env.example`
```
# Backend
PERPLEXITY_API_KEY=your_perplexity_api_key_here
JWT_SECRET=your_jwt_secret_here

# Frontend
VITE_API_BASE_URL=/api
```

### Step 2.4: Create `backend/services/differ.py`

Extract from `BurilarTracker`:
```python
class UpdateDiffer:
    def detect_structured_diff(old_data, new_data, schema_type) -> Optional[Dict]
        # From BurilarTracker._detect_structured_diff
    def detect_text_diff(old_text, new_text, keywords) -> Optional[str]
        # From BurilarTracker.detect_differences
```

### Step 2.5: Move `assess_topic_status` into `TrackingAnalyzer`

Move from `tracker.py` to `backend/services/analyzer.py`:
```python
def assess_topic_status(self, search_result: str) -> Dict:
    # Returns {"status": "completed"|"in_progress", "explanation": "..."}
```

### Step 2.6: Replace `NotificationManager` in `backend/services/notifier.py`

```python
from backend.storage import notification_storage

class NotificationService:
    def notify_update(self, user_id, tracking_id, title, message, details=None):
        return notification_storage.create_notification(user_id, {
            "type": "update",
            "title": title,
            "message": message,
            "tracking_id": tracking_id,
            "details": details,
            "read": False
        })

    def get_feedback_summary(self, tracking_id):
        return notification_storage.get_feedback_summary(tracking_id)
```

### Step 2.7: Rewrite `backend/core/tracker.py`

Target: ~120 lines. Uses storage + services, no file I/O.

```python
from backend.storage import tracking_storage, notification_storage
from backend.services.analyzer import TrackingAnalyzer
from backend.services.architect import TrackingArchitect
from backend.services.executor import TrackingExecutor
from backend.services.extractor import InformationExtractor
from backend.services.notifier import NotificationService
from backend.services.differ import UpdateDiffer
from backend.services.perplexity import call_perplexity

class BurilarTracker:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.analyzer = TrackingAnalyzer()
        self.architect = TrackingArchitect()
        self.executor = TrackingExecutor()
        self.extractor = InformationExtractor()
        self.notifier = NotificationService()
        self.differ = UpdateDiffer()

    def process_query(self, query, chat_history=None) -> Dict:
        # Orchestrate: normalize -> resolve context -> feasibility -> ambiguity
        # Returns: { resolved_query, needs_clarification, questions?, status }

    def search(self, query) -> Dict:
        # One-shot search: call perplexity, assess status, return results
        # Returns: { content, status, explanation, images }

    def create_tracking(self, user_id, query, search_result=None) -> Dict:
        # Analyze intent -> architect strategy -> save via tracking_storage
        # Returns: the created tracking dict

    def execute_tracking(self, user_id, tracking_id) -> Optional[Dict]:
        # Run executor -> extractor -> differ -> notify if update found
        # Updates tracking in storage, returns update dict or None

    def check_all_updates(self):
        # Get all active trackings due for check via tracking_storage.get_active_trackings()
        # Call execute_tracking for each

    def handle_feedback(self, user_id, tracking_id, notification_id, feedback):
        # Submit feedback via notifier, trigger adaptive learning if "not_useful"
```

### Step 2.8: Delete `backend/models/tracking.py`
The `TrackingPlan` class is no longer needed — storage uses dicts.
Update `backend/models/__init__.py` accordingly.

---

## Phase 3: Backend — New REST API Routes

**Goal**: All routes in blueprints. `burilar_api.py` is just app setup.

### Step 3.1: Create `backend/routes/search.py`

```
Blueprint: search_bp, url_prefix='/api'

POST /search
  @auth_required
  Input:  { "query": "...", "chatHistory"?: [...] }
  Flow:   tracker.process_query() -> if needs_clarification, return questions
          else tracker.search() -> return results
  Response (success):
    {
      "query": "...",
      "resolvedQuery": "...",
      "needsClarification": false,
      "content": "...",
      "status": "completed" | "in_progress",
      "statusExplanation": "...",
      "images": [...]
    }
  Response (clarification needed):
    {
      "query": "...",
      "resolvedQuery": "...",
      "needsClarification": true,
      "reason": "...",
      "questions": ["...", "..."]
    }
```

Note: This is a stateless search. No tracking is created. The frontend can use the result to decide whether to create a tracking.

### Step 3.2: Create `backend/routes/trackings.py`

```
Blueprint: trackings_bp, url_prefix='/api/trackings'
All routes require @auth_required

POST /
  Create a tracking from a query (optionally with prior search result)
  Input:  {
    "query": "...",
    "searchResult"?: "...",        # Optional: reuse prior search
    "frequency"?: "daily",
    "notificationEnabled"?: true
  }
  Flow:   tracker.create_tracking(user_id, query, search_result)
  Response: { "tracking": {...} }

GET /
  List all trackings for current user
  Response: { "trackings": [{...}, ...] }

GET /<id>
  Get tracking with updates
  Response: { "tracking": {..., "updates": [...]} }

PATCH /<id>
  Update tracking settings
  Input:  { "isActive"?, "isPinned"?, "frequency"?, "notificationEnabled"? }
  Response: { "tracking": {...} }

DELETE /<id>
  Delete tracking
  Response: 204

POST /<id>/execute
  Manual refresh — run the tracking pipeline now
  Flow:   tracker.execute_tracking(user_id, tracking_id)
  Response: { "update": {...} } or { "message": "No new updates" }

GET /<id>/updates
  Paginated updates for a tracking
  Query:  ?page=1&pageSize=20
  Response: { "updates": [...], "total": int }

POST /<id>/updates/read
  Mark specific updates as read
  Input:  { "updateIds": [...] }
  Response: { "success": true, "updatedCount": int }

POST /<id>/updates/read-all
  Mark all updates as read
  Response: { "success": true, "updatedCount": int }
```

Tracker access: The blueprint gets the tracker via `current_app.config['tracker']`.
```python
from flask import current_app
tracker = current_app.config['tracker']
```

### Step 3.3: Rewrite `backend/routes/notifications.py`

```
Blueprint: notifications_bp, url_prefix='/api/notifications'
All routes require @auth_required

GET /
  List notifications
  Query:  ?unread_only=false&limit=50&offset=0
  Response: { "notifications": [...], "unreadCount": int }

GET /unread-count
  Response: { "count": int }

PATCH /<id>/read
  Mark one notification as read
  Response: { "success": true }

POST /mark-all-read
  Mark all notifications as read
  Response: { "success": true, "updatedCount": int }

DELETE /<id>
  Delete notification
  Response: 204

POST /<id>/feedback
  Submit feedback
  Input:  { "feedback": "useful" | "not_useful" }
  Flow:   If "not_useful", trigger tracker.handle_feedback()
  Response: { "success": true }
```

### Step 3.4: Clean up existing routes
- `backend/routes/auth.py` — Remove debug `print()` statements, remove Google OAuth mock (or keep if needed)
- `backend/routes/chats.py` — Remove tracking-related fields: `is_tracking`, `tracking_active`, `tracking_frequency`, `notification_enabled`, `notification_granularity`. These belong on trackings now.
- `backend/storage/chats.py` — Remove corresponding fields from `create_chat`

### Step 3.5: Rewrite `burilar_api.py`

Target: ~45 lines.
```python
import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from backend.core.tracker import BurilarTracker

# App setup
app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app)

# Tracker singleton — shared with blueprints via app.config
tracker = BurilarTracker.get_instance()
app.config['tracker'] = tracker

# Register blueprints
from backend.routes import auth_bp, chats_bp, trackings_bp, notifications_bp, search_bp
app.register_blueprint(auth_bp)
app.register_blueprint(chats_bp)
app.register_blueprint(trackings_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(search_bp)

# SPA fallback
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# Background scheduler
import threading, time

def background_checker():
    while True:
        time.sleep(300)
        try:
            tracker.check_all_updates()
        except Exception as e:
            print(f"Background check error: {e}")

threading.Thread(target=background_checker, daemon=True).start()

if __name__ == '__main__':
    app.run(debug=True, port=5050)
```

### Step 3.6: Update `backend/routes/__init__.py`
```python
from .auth import auth_bp
from .chats import chats_bp
from .trackings import trackings_bp
from .notifications import notifications_bp
from .search import search_bp
```

---

## Phase 4: Backend — Testing & Validation

### Step 4.1: API testing script

File: `scripts/test_api.py`

Tests the full flow with `requests`:
1. Register user -> get token
2. `POST /api/search` with a query -> verify response shape
3. `POST /api/search` with ambiguous query -> verify clarification response
4. `POST /api/trackings` -> create tracking -> verify response
5. `GET /api/trackings` -> verify list includes new tracking
6. `GET /api/trackings/:id` -> verify detail
7. `PATCH /api/trackings/:id` -> toggle isActive
8. `POST /api/trackings/:id/execute` -> manual refresh
9. `GET /api/notifications` -> check if update generated notification
10. `PATCH /api/notifications/:id/read` -> mark read
11. `POST /api/notifications/:id/feedback` -> submit feedback
12. `DELETE /api/trackings/:id` -> delete tracking
13. Verify 401 on all endpoints without auth token

### Step 4.2: Run migration and verify
- Run `scripts/migrate_storage.py`
- Verify `data/trackings.json` has correct shape
- Verify `data/notifications.json` has merged data
- After verification, delete old files: `burilar_tracking_data.json`, `burilar_notifications.json`

---

## Phase 5: Frontend — Clean Slate

**Goal**: Delete all page components, keep infrastructure, rebuild from scratch.

### Step 5.1: Delete these files
```
# Old page components (all Figma exports)
src/components/AttachmentMenu.tsx
src/components/ChatInput.tsx
src/components/ChatMessage.tsx
src/components/CollapsedSidebar.tsx
src/components/DefaultModeTrackingDetail.tsx
src/components/Header.tsx
src/components/IntegrationCard.tsx
src/components/IntegrationScreen.tsx
src/components/LoginModal.tsx
src/components/ModeSelector.tsx
src/components/NotebookCreationModal.tsx
src/components/NotificationSettings.tsx
src/components/PlanManagement.tsx
src/components/PlanSelection.tsx
src/components/SettingsMenu.tsx
src/components/Sidebar.tsx
src/components/SimpleTrackingSetup.tsx
src/components/TrackingListView.tsx
src/components/TrackingPage.tsx
src/components/TrackingRefinementChat.tsx
src/components/TrackingSettingsScreen.tsx
src/components/TrackingStatusBadge.tsx
src/components/TrackingSuccessMessage.tsx
src/components/TrackingSuggestionCard.tsx
src/components/UserDropdown.tsx
src/components/figma/ImageWithFallback.tsx

# Dead code
src/data/demoData.ts
src/data/demoScenarios.ts

# Duplicates and unused
src/types/notification.ts        # duplicate of notifications.ts
src/types/integrations.ts        # not needed
src/api/integrations.ts          # not needed

# Chat (dropping for now)
src/api/chats.ts
src/hooks/useChat.ts
src/types/chat.ts
```

### Step 5.2: Keep (infrastructure)
```
src/api/client.ts               # Fetch wrapper
src/api/types.ts                 # Base API types
src/components/ui/*              # shadcn components
src/components/AuthGuard.tsx     # Auth guard
src/context/AuthContext.tsx       # Auth state
src/vite-env.d.ts
src/main.tsx                     # Will be updated
```

### Step 5.3: Update frontend types

`src/types/tracking.ts` — Minor updates to align with new backend:
- `promptContent` -> `query` (match backend field name)
- Remove `notificationGranularity` (dropped for simplicity)
- Keep everything else — the types were already well-designed

`src/types/notification.ts` (rename from `notifications.ts` to singular):
```typescript
export interface Notification {
  id: string;
  type: 'update' | 'system' | 'info';
  title: string;
  message: string;
  trackingId?: string;
  read: boolean;
  feedback?: 'useful' | 'not_useful';
  details?: { changes?: string[]; sources?: TrackingSource[] };
  createdAt: string;
}
```

`src/types/user.ts` — Keep as-is.

`src/types/index.ts` — Re-export tracking, notification, user types. Remove chat.

### Step 5.4: Update API layer

`src/api/trackings.ts` — Verify endpoints match Phase 3.2 routes. Mostly correct already.

`src/api/notifications.ts` — Update to match Phase 3.3 routes.

`src/api/search.ts` — New file for `POST /api/search`:
```typescript
export interface SearchRequest { query: string; chatHistory?: Message[] }
export interface SearchResponse {
  query: string;
  resolvedQuery: string;
  needsClarification: boolean;
  content?: string;
  status?: 'completed' | 'in_progress';
  statusExplanation?: string;
  images?: string[];
  reason?: string;
  questions?: string[];
}
export async function search(data: SearchRequest): Promise<SearchResponse> { ... }
```

`src/api/auth.ts` — Keep as-is.

`src/api/index.ts` — Re-export all API modules.

### Step 5.5: Build hooks FIRST (before components)

`src/hooks/useTracking.ts`:
```typescript
// Real API calls, React state management
- trackings: TrackingListItem[]          // cached list
- selectedTracking: TrackingWithUpdates  // currently viewed
- loading, error states
- fetchTrackings()
- fetchTracking(id)
- createTracking(query, options?)
- updateTracking(id, data)
- deleteTracking(id)
- executeTracking(id)
- markUpdatesRead(id, updateIds)
```

`src/hooks/useSearch.ts`:
```typescript
// Manages the search -> clarify -> create tracking flow
- searchResult: SearchResponse
- isSearching: boolean
- search(query)
- reset()
```

`src/hooks/useNotifications.ts`:
```typescript
// With polling (setInterval)
- notifications: Notification[]
- unreadCount: number
- fetchNotifications()
- markRead(id)
- markAllRead()
- submitFeedback(id, feedback)
// Auto-polls every 30 seconds when mounted
```

---

## Phase 6: Frontend — Rebuild Components

**Goal**: Minimal, functional UI built with shadcn/ui. No Figma exports.

### New component structure:
```
src/
  components/
    ui/                          # Keep — shadcn
    layout/
      AppLayout.tsx              # Main shell: sidebar + content
      Header.tsx                 # Top bar: logo, notifications bell, user menu
      Sidebar.tsx                # Tracking list + "New" button
    tracking/
      TrackingList.tsx           # List of all trackings (main content or sidebar)
      TrackingCard.tsx           # Single tracking in the list
      TrackingDetail.tsx         # Full detail: status, updates timeline, settings
      TrackingCreate.tsx         # Search -> clarify -> confirm -> create flow
      UpdateItem.tsx             # Single update in the timeline
    auth/
      LoginModal.tsx             # Login/register modal
      AuthGuard.tsx              # Keep existing
    notifications/
      NotificationPanel.tsx      # Dropdown from bell icon
      NotificationItem.tsx       # Single notification entry
  hooks/
    useTracking.ts
    useSearch.ts
    useNotifications.ts
  pages/
    HomePage.tsx                 # Dashboard: tracking list + create
    TrackingDetailPage.tsx       # View a specific tracking
    SettingsPage.tsx             # User settings (future)
  api/
    client.ts
    types.ts
    auth.ts
    search.ts
    trackings.ts
    notifications.ts
    index.ts
  types/
    tracking.ts
    notification.ts
    user.ts
    index.ts
  context/
    AuthContext.tsx
```

### Step 6.1: Build hooks (Step 5.5 — done before components)

### Step 6.2: Build layout shell
- `AppLayout.tsx`: shadcn Sidebar + main content area, responsive
- `Header.tsx`: Logo, notification bell (badge with unreadCount), user avatar dropdown (logout)
- `Sidebar.tsx`: TrackingList + "New Tracking" button at top

### Step 6.3: Build tracking flow
- `TrackingCreate.tsx`: Search input -> show results -> "Track this" button -> creates tracking
  - Handles clarification: shows questions, user re-submits refined query
  - Shows "completed" vs "in_progress" status from search
  - Only offers tracking for "in_progress" topics
- `TrackingList.tsx`: Cards for each tracking, sorted by updated_at
- `TrackingCard.tsx`: Title, status badge, unread count, last update preview, pin/active toggle
- `TrackingDetail.tsx`: Full view — metadata, settings (frequency, notifications), updates timeline, manual refresh button
- `UpdateItem.tsx`: Content, sources as links, timestamp, read/unread indicator, useful/not_useful feedback buttons

### Step 6.4: Build auth
- `LoginModal.tsx`: Email/password form, register toggle. Using shadcn Dialog + Input + Button.

### Step 6.5: Build notifications
- `NotificationPanel.tsx`: shadcn Popover from bell icon, list of NotificationItems, "Mark all read" button
- `NotificationItem.tsx`: Title, message, timestamp, click to mark read + navigate to tracking

### Step 6.6: Build pages
- `HomePage.tsx`: AppLayout wrapping TrackingCreate (top) + TrackingList (below)
- `TrackingDetailPage.tsx`: AppLayout wrapping TrackingDetail, route param `:id`

### Step 6.7: Update `src/main.tsx`
- React Router setup: `/` -> HomePage, `/tracking/:id` -> TrackingDetailPage
- AuthContext provider
- Sonner (toast) provider for error notifications

---

## Phase 7: Polish

### Step 7.1: Error handling
- Toast notifications for API errors (shadcn Sonner — already in ui/)
- Loading states with shadcn Skeleton
- Empty states: "No trackings yet", "No updates yet", "No notifications"

### Step 7.2: Responsive design
- Sidebar collapses to Sheet on mobile
- Tracking cards stack vertically on small screens

### Step 7.3: Cleanup
- Delete old backend files after migration confirmed: `burilar_tracking_data.json`, `burilar_notifications.json`
- Delete `backend/utils/ai.py`
- Delete `backend/models/tracking.py`
- Remove `backend/routes/chats.py` tracking fields
- Run through and remove any remaining dead imports

---

## Execution Order

| Step | Phase | Description | Depends On |
|------|-------|-------------|------------|
| 1 | 1.1 | Create TrackingStorage | -- |
| 2 | 1.2 | Create NotificationStorage | -- |
| 3 | 1.3 | Update storage __init__ | 1, 2 |
| 4 | 1.4 | Migration script | 1, 2 |
| 5 | 2.1 | Delete backend/utils/ai.py, fix import in chats.py | -- |
| 6 | 2.2 | Fix perplexity.py (remove hardcoded key) | -- |
| 7 | 2.3 | Update .env.example | -- |
| 8 | 2.4 | Create differ.py | -- |
| 9 | 2.5 | Move assess_topic_status to analyzer | -- |
| 10 | 2.6 | Replace NotificationManager with NotificationService | 2 |
| 11 | 2.7 | Rewrite BurilarTracker (slim, singleton) | 1, 2, 8, 9, 10 |
| 12 | 2.8 | Delete backend/models/tracking.py | 11 |
| 13 | 3.1 | Create search blueprint | 11 |
| 14 | 3.2 | Create trackings blueprint | 11 |
| 15 | 3.3 | Rewrite notifications blueprint | 10 |
| 16 | 3.4 | Clean up auth + chats routes | -- |
| 17 | 3.5 | Rewrite burilar_api.py | 13, 14, 15, 16 |
| 18 | 3.6 | Update routes __init__ | 13, 14, 15 |
| 19 | 4.1 | API testing script | 17 |
| 20 | 4.2 | Run migration + verify | 4, 17 |
| -- | -- | **BACKEND COMPLETE** | -- |
| 21 | 5.1 | Delete old frontend components | -- |
| 22 | 5.3 | Update frontend types | -- |
| 23 | 5.4 | Update API layer + create search.ts | 17 |
| 24 | 5.5 | Build hooks (useTracking, useSearch, useNotifications) | 22, 23 |
| 25 | 6.2 | Build layout shell | 21 |
| 26 | 6.3 | Build tracking flow components | 24, 25 |
| 27 | 6.4 | Build auth components | 25 |
| 28 | 6.5 | Build notification components | 24, 25 |
| 29 | 6.6 | Build pages | 26, 27, 28 |
| 30 | 6.7 | Update main.tsx with router | 29 |
| 31 | 7.1 | Error handling + loading states | 30 |
| 32 | 7.2 | Responsive design | 30 |
| 33 | 7.3 | Final cleanup | 20, 31 |

---

## Files Summary

### Created (New)
```
backend/storage/trackings.py
backend/storage/notifications.py
backend/services/differ.py
backend/routes/trackings.py
backend/routes/search.py
scripts/migrate_storage.py
scripts/test_api.py
src/api/search.ts
src/hooks/useSearch.ts
src/components/layout/AppLayout.tsx
src/components/layout/Header.tsx
src/components/layout/Sidebar.tsx
src/components/tracking/TrackingList.tsx
src/components/tracking/TrackingCard.tsx
src/components/tracking/TrackingDetail.tsx
src/components/tracking/TrackingCreate.tsx
src/components/tracking/UpdateItem.tsx
src/components/auth/LoginModal.tsx
src/components/notifications/NotificationPanel.tsx
src/components/notifications/NotificationItem.tsx
src/pages/HomePage.tsx
src/pages/TrackingDetailPage.tsx
```

### Modified
```
backend/core/tracker.py           # Major rewrite — slim singleton
backend/services/analyzer.py      # Add assess_topic_status
backend/services/notifier.py      # Replace NotificationManager with NotificationService
backend/services/perplexity.py    # Remove hardcoded key, add retry
backend/routes/__init__.py        # Add new exports
backend/routes/notifications.py   # Full rewrite
backend/routes/auth.py            # Remove debug prints
backend/routes/chats.py           # Remove tracking fields, fix perplexity import
backend/storage/__init__.py       # Add new exports
backend/storage/chats.py          # Remove tracking fields from create_chat
burilar_api.py                    # Major rewrite — ~45 lines
.env.example                      # Add PERPLEXITY_API_KEY
src/types/tracking.ts             # promptContent -> query
src/types/index.ts                # Update exports
src/api/trackings.ts              # Verify endpoint alignment
src/api/notifications.ts          # Update endpoints
src/api/index.ts                  # Update exports
src/hooks/useTracking.ts          # Full rewrite — real API
src/hooks/useNotifications.ts     # Full rewrite — real API with polling
src/main.tsx                      # Router + providers
src/components/AuthGuard.tsx      # Move to src/components/auth/
```

### Deleted
```
# Backend
backend/utils/ai.py               # Duplicate Perplexity wrapper
backend/models/tracking.py        # TrackingPlan class no longer needed
burilar_tracking_data.json         # Replaced by data/trackings.json
burilar_notifications.json         # Merged into data/notifications.json

# Frontend — old components
src/components/AttachmentMenu.tsx
src/components/ChatInput.tsx
src/components/ChatMessage.tsx
src/components/CollapsedSidebar.tsx
src/components/DefaultModeTrackingDetail.tsx
src/components/Header.tsx
src/components/IntegrationCard.tsx
src/components/IntegrationScreen.tsx
src/components/LoginModal.tsx
src/components/ModeSelector.tsx
src/components/NotebookCreationModal.tsx
src/components/NotificationSettings.tsx
src/components/PlanManagement.tsx
src/components/PlanSelection.tsx
src/components/SettingsMenu.tsx
src/components/Sidebar.tsx
src/components/SimpleTrackingSetup.tsx
src/components/TrackingListView.tsx
src/components/TrackingPage.tsx
src/components/TrackingRefinementChat.tsx
src/components/TrackingSettingsScreen.tsx
src/components/TrackingStatusBadge.tsx
src/components/TrackingSuccessMessage.tsx
src/components/TrackingSuggestionCard.tsx
src/components/UserDropdown.tsx
src/components/figma/ImageWithFallback.tsx

# Frontend — dead code & duplicates
src/data/demoData.ts
src/data/demoScenarios.ts
src/types/notification.ts          # duplicate
src/types/integrations.ts
src/api/integrations.ts

# Frontend — chat (dropped)
src/api/chats.ts
src/hooks/useChat.ts
src/types/chat.ts
```
