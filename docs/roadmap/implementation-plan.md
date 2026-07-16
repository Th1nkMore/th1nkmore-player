# Implementation Plan

## Goal

Evolve Sonic IDE from a polished single-owner player into a personal cover portfolio and audio journal without reopening the abandoned general-purpose platform direction.

Each implementation branch should start from `dev`, remain independently acceptable, and preserve existing songs that do not yet contain story fields.

## Phase 0: Product And Documentation Alignment

Suggested branch:

- `feat/creator-note-roadmap`

Scope:

- Define a public track as a full cover recording plus optional lyrics and Creator Note
- Define Creator Note text and spoken audio as supporting editorial content
- Fix the one-audio-focus policy
- Reprioritize recording, sharing, playback continuity, themes, and backend work
- Mark multi-user, arbitrary music sources, marketplace, and generic embed work as non-goals

Acceptance:

- Product, architecture, data model, specs, and roadmap documents agree
- Implemented capabilities are separated clearly from planned capabilities
- No document describes spoken-note audio as a song or queue item

## Phase 1: Mobile Swipe Pager

Suggested branch:

- `feat/mobile-swipe-pager`

Scope:

- Replace mobile portrait's hidden-section switching with a gesture-aware horizontal pager
- Keep the page order Lyrics, Songs, Info
- Synchronize gestures with the existing bottom navigation state
- Preserve page-local scroll, search, filter, and reading state
- Prevent conflicts with horizontal scrollers, playback sequence, sliders, and media controls

Acceptance:

- A deliberate horizontal swipe changes exactly one page
- Vertical scrolling does not trigger page changes
- Child horizontal controls keep their native gestures
- First and last pages use edge resistance and do not wrap
- Bottom navigation remains a complete non-gesture fallback
- Reduced-motion users receive a restrained transition
- Portrait and landscape layout behavior remains stable

## Phase 2: Creator Note Model And Authoring

Suggested branch:

- `feat/creator-note-authoring`

Scope:

- Add optional `performanceType`, `originalArtist`, `shareSlug`, and `creatorNote` fields
- Normalize older songs without requiring a full catalog migration
- Add Creator Note text editing in admin
- Support spoken-note upload, preview, replacement, and removal
- Add a lightweight spoken-note recorder using existing low-level microphone primitives
- Keep full cover recording and spoken-note recording as separate admin workflows

Acceptance:

- Existing songs still build, load, and play without new fields
- Text-only, spoken-only, and combined Creator Notes can be saved
- Empty Creator Note objects are removed or rejected
- A spoken note can be recorded or uploaded, previewed, replaced, and removed
- The full recording workspace does not become the UI for a short spoken note
- Admin publishing does not expose raw object-management complexity to the normal authoring flow

## Phase 3: Information Story Surface

Suggested branch:

- `feat/creator-note-info-surface`

Scope:

- Remove `WaveformMinimap` from the information surface
- Make Creator Note content the primary information hierarchy
- Add an inline spoken-note player with progress and duration
- Add a shared audio-focus coordinator for the cover and spoken note
- Preserve song position when the spoken note pauses the cover
- Pause spoken audio when leaving the information context
- Add a clear action to continue the cover; do not auto-resume after the note ends

Acceptance:

- The song and spoken note never play at the same time
- Spoken audio never appears in the queue, playback sequence, shuffle, repeat, or song transport
- Starting the cover stops spoken audio
- Leaving the Info page pauses spoken audio
- Mobile provides a readable full-width story surface
- Desktop provides a scrollable story layout without forcing long prose into metadata rows
- Tracks without a Creator Note fall back to concise credits and metadata

## Phase 4: Track Share Pages

Suggested branch:

- `feat/track-story-sharing`

Scope:

- Add localized track routes based on ID or stable `shareSlug`
- Server-render title, credits, Creator Note summary, and social metadata
- Reuse the information-story component in a share-focused layout
- Present both the full cover and optional spoken note with one-audio-focus behavior
- Add an action to open the work inside Sonic IDE
- Change public copy-link actions from raw audio URLs to track pages
- Include published track routes in the sitemap

Acceptance:

- A direct track URL resolves the correct published work
- The page does not require the full IDE shell to be understandable
- Social previews identify the track and personal story
- The share page and IDE information page do not duplicate content logic
- Raw R2 audio URLs are not used as normal public share links
- Missing, private, draft, or archived entries do not produce public share pages

## Phase 5: Playback Continuity

Suggested branches:

- `feat/player-session-persistence`
- `feat/media-session`

Scope:

- Restore current track, safe playback position, queue, volume, and play order
- Keep restored state compatible with changed or removed library entries
- Add Media Session metadata and hardware transport actions
- Decide later whether installable web behavior is valuable enough for a dedicated PWA phase

Acceptance:

- Returning to the app restores useful state without unexpected autoplay
- Removed or private songs do not break restoration
- Hardware and lock-screen controls match in-app playback behavior

## Phase 6: Curated Track Themes

Suggested branch:

- `feat/curated-track-themes`

Scope:

- Add a small set of reviewed visual presets
- Share theme tokens between the IDE story surface and share page
- Allow a controlled accent, background asset, and motion intensity
- Keep arbitrary CSS and JavaScript out of stored content

Acceptance:

- Every preset has light/dark, mobile, and reduced-motion behavior
- Theme loading does not delay the usable player or block reading
- Lyrics and controls retain sufficient contrast
- A missing or invalid theme falls back to the normal Sonic IDE appearance

## Phase 7: Asset And Delivery Hardening

Suggested branches:

- `feat/library-backup-restore`
- `feat/media-asset-lifecycle`
- `feat/release-quality-gates`

Scope:

- Back up and restore the playlist manifest and Creator Note fields
- Replace and delete song and spoken-note assets explicitly
- Detect orphaned R2 objects
- Add frozen-lockfile install, lint, type-check, tests, and build to remote release validation
- Add playback-error and publish-failure monitoring
- Implement signed delivery only if non-public personal content becomes a real use case

Acceptance:

- Manifest rollback is documented and tested
- Removing a playlist entry cannot silently destroy the wrong object
- Creator Note audio participates in replacement, deletion, and orphan checks
- A failed quality gate prevents deployment

## Parked Work

Do not schedule these without new evidence:

- Multi-user accounts and public uploads
- Third-party music-source adapters or source plugins
- Public marketplace behavior
- Generic embed SDK
- Additional export formats
- Generalized backend media-processing platform
- Desktop application wrapper
- More public locales
- Arbitrary theme code

## Recommended Immediate Order

1. Accept the documentation alignment
2. Implement the mobile swipe pager as a contained interaction improvement
3. Implement Creator Note data and admin authoring
4. Replace the information surface and remove the waveform
5. Add track share pages
6. Add playback continuity
7. Add curated visual themes
8. Harden asset lifecycle and remote release gates continuously where risk requires it
