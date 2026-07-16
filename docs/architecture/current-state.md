# Current Architecture Baseline

## Summary

Sonic IDE is a Next.js App Router application combining a public listening experience with an authenticated single-owner media workspace.

The current codebase is a usable player and publishing baseline. The newly agreed product direction—Creator Notes, track share pages, mobile swipe paging, and per-track themes—is not implemented yet and should be treated as roadmap work.

## Current Public Capabilities

- IDE-like library browsing, tag exploration, metadata, queue, and playback
- A playback sequence strip with explicit song-player semantics
- Global Howler-based audio playback
- LRC lyrics with active-line synchronization and seeking
- Responsive desktop, mobile portrait, and mobile landscape layouts
- Bottom navigation for mobile Lyrics, Songs, and Info surfaces
- Localized public routes for English, Chinese, Japanese, and German
- Public playlist delivery from Cloudflare R2 with ISR and a public fallback

## Current Admin Capabilities

- Password-based admin access with a cookie-backed session
- Direct signed uploads to R2
- Playlist loading, editing, ordering, and removal from the manifest
- Lyric fetching, normalization, and editing
- Track classification, tags, and visibility fields
- In-browser full recording with preview, retry, and upload handoff
- Browser-side MP3 export for newly recorded audio

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

- No Creator Note data, authoring workflow, spoken-note player, or transcript support
- No track-level route, server-rendered share page, or per-track social metadata
- The existing copy-link action copies a raw audio URL instead of a work page
- Mobile portrait uses bottom-navigation switching without gesture-aware horizontal paging
- The information surface still prioritizes a generated waveform and generic properties over personal narrative
- Playback session state is not restored across visits, and Media Session integration is absent
- Portfolio/personal classification exists in data and admin but has little public presentation impact
- Per-track visual themes are not implemented

## Known Technical Gaps

- Song audio and future spoken-note audio need a shared audio-focus coordinator
- The library remains a flat manifest rather than a rich media catalog
- Playlist removal does not automatically remove backing R2 assets
- Public R2 URLs do not provide storage-level privacy
- Remote deployment should add frozen-lockfile install, lint, type-check, and tests before build and deploy
- Runtime product analytics and playback-error monitoring are not formalized
