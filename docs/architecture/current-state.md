# Current Architecture Baseline

## Summary

Sonic IDE is currently a Next.js App Router application that already behaves as a music player with an admin upload workflow.

The codebase combines a public listening experience and an authenticated admin experience in one project.

## Current Frontend Capabilities

- IDE-like browsing layout for songs, albums, metadata, queue, and playback
- Global audio playback behavior
- Lyrics display with LRC parsing and active-line syncing
- Responsive UI for desktop and mobile
- Localized routing and message bundles

## Current Admin Capabilities

- Magic-link style admin access
- Audio upload flow using signed URLs
- Playlist loading and editing
- NetEase lyric fetching
- Metadata extraction from selected audio files

## Current Technical Shape

- Framework: Next.js 16 with React 19
- State management: Zustand
- Styling: Tailwind CSS 4 and component primitives
- Playback engine: Howler
- Storage integration: Cloudflare R2 via AWS SDK
- Internationalization: next-intl

## Main Code Areas

- `src/app`: routes, layouts, and API endpoints
- `src/components/ide`: public player-facing IDE interface
- `src/components/admin`: admin upload and playlist tooling
- `src/lib`: auth, storage, utility, lyrics, and hooks
- `src/store`: player and IDE state

## Known Gaps

- The library model is still documented and implemented primarily as a playlist, not yet as a richer media catalog
- Recording is not yet present
- Export to formats beyond the current upload/play flow is not yet present
- Backend responsibilities are still relatively lightweight and will need expansion for future media workflows
- CI/CD and performance optimization are not yet formalized as project infrastructure
