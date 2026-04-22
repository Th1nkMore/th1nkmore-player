# Current Architecture Baseline

## Summary

Sonic IDE is currently a Next.js App Router application that behaves as a music player with an authenticated admin media workspace.

The codebase combines a public listening experience and an authenticated admin experience in one project.

## Current Frontend Capabilities

- IDE-like browsing layout for songs, albums, metadata, queue, and playback
- Files/Grid explorer switching for per-track browsing and tag-based bulk queueing
- Global audio playback behavior
- Lyrics display with LRC parsing and active-line syncing
- Responsive UI for desktop and mobile
- Localized routing and message bundles

## Current Admin Capabilities

- Password-based admin access with cookie-backed session state
- Audio upload flow using signed URLs
- Playlist loading and editing
- NetEase lyric fetching
- Shared LRC normalization for imported and fetched lyrics
- Metadata extraction from selected audio files
- Track classification fields for track type, source type, visibility, and asset status
- Song-level tags managed in admin and consumed in the public listener explorer
- In-browser recording with preview and retry
- Save recorded audio into the managed library
- Browser-side MP3 export for recorded audio
- Recording teleprompter with stabilized lyric auto-follow

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

- The library model is still implemented primarily as a playlist, not yet as a richer media catalog
- Recording exists, but the state model is still lightweight and does not yet formalize draft vs publish behavior
- MP3 export exists for newly recorded audio, but export is not yet generalized across all managed tracks or formats
- Backend responsibilities are still relatively lightweight and will need expansion for future media workflows
- CI/CD and performance optimization are not yet formalized as project infrastructure
