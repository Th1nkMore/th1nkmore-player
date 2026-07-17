# Current Architecture Baseline

## Summary

Sonic IDE is a Next.js App Router application combining a public listening experience with an authenticated single-owner media workspace.

The current codebase is a usable player and publishing baseline. Bottom-navigation swipe switching and Creator Note authoring are deployed. The information story surface is implemented locally; track share pages and per-track themes remain roadmap work.

## Current Public Capabilities

- IDE-like library browsing, tag exploration, metadata, queue, and playback
- A playback sequence strip with explicit song-player semantics
- Global Howler-based audio playback
- LRC lyrics with active-line synchronization and seeking
- Responsive desktop, mobile portrait, and mobile landscape layouts
- Gesture-aware mobile portrait paging between Lyrics, Songs, and Info, synchronized with bottom navigation
- Localized public routes for English, Chinese, Japanese, and German
- Public playlist delivery from Cloudflare R2 with ISR and a public fallback
- Narrative track information with cover credits, personal writing, optional spoken audio, transcript, tags, and metadata fallback
- Shared audio focus that keeps the cover and spoken Creator Note mutually exclusive

## Current Admin Capabilities

- Password-based admin access with a cookie-backed session
- Direct signed uploads to R2
- Playlist loading, editing, ordering, and removal from the manifest
- Lyric fetching, normalization, and editing
- Track classification, tags, and visibility fields
- In-browser full recording with preview, retry, and upload handoff
- Browser-side MP3 export for newly recorded audio
- Creator Note writing, language, spoken upload or recording, transcript, replacement, and removal

## Current Delivery And Quality

- Local pre-commit guards run staged Biome checks, file-length validation, and a full TypeScript check
- Vitest covers player state, APIs, library behavior, lyrics, recording sessions, tags, and playback sequence logic
- Pushing `live` triggers a GitHub Actions production build and SSH deployment to the personal server
- The remote deployment gate currently builds the application but does not independently run lint and the full test suite

## Main Code Areas

- `src/app`: routes, layouts, metadata, and API endpoints
- `src/components/ide`: public player and IDE interface
- `src/components/admin`: owner publishing, recording, and playlist tools
- `src/lib`: auth, storage, media, lyrics, and shared behavior
- `src/store`: IDE and player state

## Known Product Gaps

- No track-level route, server-rendered share page, or per-track social metadata
- The existing copy-link action copies a raw audio URL instead of a work page
- Playback session state is not restored across visits, and Media Session integration is absent
- Portfolio/personal classification exists in data and admin but has little public presentation impact
- Per-track visual themes are not implemented

## Known Technical Gaps

- The library remains a flat manifest rather than a rich media catalog
- Playlist removal does not automatically remove backing R2 assets
- Public R2 URLs do not provide storage-level privacy
- Remote deployment should add frozen-lockfile install, lint, type-check, and tests before build and deploy
- Runtime product analytics and playback-error monitoring are not formalized
