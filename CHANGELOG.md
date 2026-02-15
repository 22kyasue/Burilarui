# Changelog

## [1.1.0] - 2026-02-15
### Added
- Notifications API
- Integrations API
- User & Plan Management API
- Authentication & Chat Persistence
- Toast Notification Markdown Support
- Fix Toast Notification Close Button

## [1.0.4] - 2026-02-09

### Fixed
- **Mobile Responsiveness**: Fixed the `TrackingDetail` panel layout to take full width on mobile devices (`375px`) instead of being squashed, while maintaining the split-view on desktop.
- **Code Quality**: Resolved CSS lint errors (invalid `vertical-align`, added `line-clamp`) and fixed unused variables in `TrackingDetail.tsx`.

## [1.0.2] - 2026-02-09

### Improved
- **Chat Input UI**: Redesigned file attachment previews to be compact (thumbnail style) with persistent delete badges. This prevents the input area from expanding excessively and breaking the layout, ensuring consistent behavior across both Home and Chat screens.

## [1.0.1] - 2026-02-08

### Fixed
- **UI Layout**: Resolved a critical layout issue where long un-truncated text in the News Ticker caused the main content area to overflow horizontally (approx. 6000px width). Added strict flexbox constraints (`min-w-0`, `overflow-hidden`) to fix this.
- **Chat Interface**: Fixed a rendering bug where a stray '0' character appeared in the chat UI when source counts were zero.

## [1.0.0] - 2026-02-07

### Added
- "Version 1.00.00" display in Settings modal footer.
- Demo Data loading feature.
- File upload UI and drag-and-drop support.
- Real-time AI chat integration via Perplexity API.

### Fixed
- Global notification badge now correctly reflects total unread updates.
- Fixed blank screen issues on navigation.
- Fixed unread status persistence logic.
