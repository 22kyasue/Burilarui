# Burilar Implementation Plan (Post-Rebuild)

Status: Backend restructured (v2.0), UI rebuilt to Figma spec, real API wired up.

---

## Current State

### What's Done
- Backend: Flask blueprints (auth, trackings, notifications, search, chats), JSONFileStorage, singleton BurilarTracker
- Frontend: React + Vite + TypeScript, Figma-accurate UI (95-100%), real API hooks, framer-motion animations
- Components: CollapsedSidebar, Sidebar, Header, HomePage, TrackingListView, TrackingDetail, UpdatePanel, NotificationSettings, SettingsModal
- Auth: JWT login/register, AuthContext, LoginModal
- Build: Clean (0 TypeScript errors, 452KB JS bundle)

### What's Blocked
- **PERPLEXITY_API_KEY not set** — search, tracking execution, chat AI all fail without it
- Google OAuth is a mock — not production-ready

### What's Missing
- Skeleton loading states (shimmer/pulse placeholders)
- E2E testing
- Production deployment config
- Real Google OAuth
- Stripe payment integration (plan management UI exists but not wired)

---

## Phase 1: Unblock Core Features

### 1.1 Configure Perplexity API Key
- Set `PERPLEXITY_API_KEY` in `.env`
- Test: search from HomePage, tracking execution, background update checker

### 1.2 Test Full User Flow
- Register → search → create tracking → view in list → execute → see updates → notifications
- Fix any API integration bugs found during testing

---

## Phase 2: UI Polish

### 2.1 Skeleton Loading States
- Sidebar tracking items: pulse placeholder bars
- TrackingListView grid cards: shimmer rectangles
- TrackingDetail: content skeleton with animated gradient
- UpdatePanel: notification item skeletons
- Use `animate-pulse` from Tailwind + custom `shimmer` animation from globals.css

### 2.2 Empty States
- TrackingListView: "追跡中のプロンプトはまだありません" with illustration
- UpdatePanel: "新しいアップデートはありません"
- NotificationSettings: prompt list empty state

### 2.3 Error States
- API error toasts (Sonner already configured)
- Network offline indicator
- TrackingDetail: retry button on load failure

---

## Phase 3: Authentication & Payments

### 3.1 Google OAuth (Production)
- Replace mock in `backend/routes/auth.py` with real Google OAuth2 flow
- Frontend: Google Sign-In button component
- Callback handling, token exchange, user creation/login

### 3.2 Stripe Integration
- Wire up plan management modal (UI exists in SettingsModal → "プランを管理")
- Backend: Stripe checkout session, webhook for plan upgrades
- Frontend: Plan selection UI, billing portal redirect

---

## Phase 4: Backend Hardening

### 4.1 Background Scheduler
- Replace bare `threading.Thread` with APScheduler or similar
- Graceful shutdown handling
- Configurable check intervals per tracking frequency

### 4.2 Rate Limiting
- Add Flask-Limiter for API endpoints
- Per-user rate limits on search and tracking execution

### 4.3 Input Validation
- Request schema validation (marshmallow or pydantic)
- Sanitize user inputs (query, URLs)

### 4.4 Logging
- Structured logging (JSON format)
- Request/response logging middleware
- Error tracking

---

## Phase 5: Testing

### 5.1 Backend API Tests
- `tests/test_auth.py` — register, login, token validation
- `tests/test_trackings.py` — CRUD, execution, updates
- `tests/test_notifications.py` — CRUD, feedback
- `tests/test_search.py` — search, clarification flow

### 5.2 Frontend Component Tests
- Key component tests with Vitest + React Testing Library
- Hook tests (useTracking, useSearch, useNotifications)

---

## Phase 6: Deployment

### 6.1 Production Build
- Environment variable validation on startup
- Production CORS settings
- Static file serving from Vite build output

### 6.2 Render Deployment
- `render.yaml` already exists (see `note/deployment_setup.md`)
- Verify build command, start command, env vars
- Health check endpoint

### 6.3 Domain & SSL
- Custom domain setup
- HTTPS enforcement

---

## Priority Order

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P0 | 1.1 Set Perplexity API key | 5 min | Unblocks all AI features |
| P0 | 1.2 Test full user flow | 1 hour | Find integration bugs |
| P1 | 2.1 Skeleton loading states | 2 hours | Polish UX |
| P1 | 2.2-2.3 Empty/error states | 1 hour | Polish UX |
| P2 | 3.1 Google OAuth | 4 hours | Real auth |
| P2 | 4.1-4.4 Backend hardening | 6 hours | Production ready |
| P3 | 3.2 Stripe integration | 8 hours | Monetization |
| P3 | 5.1-5.2 Testing | 6 hours | Quality |
| P3 | 6.1-6.3 Deployment | 4 hours | Go live |

---

## Login Credentials (Dev)

- `demo@burilar.com` / `demo1234` — Demo account with seeded data
- `kenseiyasue@gmail.com` — Kensei's account (password unknown from this session)
