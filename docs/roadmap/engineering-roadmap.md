# Engineering And Performance Roadmap

## Current Baseline

- Local staged-file formatting, file-length checks, and full TypeScript checking
- Vitest coverage across stores, APIs, lyrics, recording state, tags, library behavior, and playback sequence
- Production build and SSH deployment triggered from `live`
- Next.js ISR and R2-backed public playlist loading

## Release Quality

Priority improvements:

- Use a frozen lockfile in CI and deployment
- Run lint, type-check, full tests, and build before deployment
- Separate validation failure from SSH/deployment failure in workflow reporting
- Add a post-deploy health check for localized routes and the public playlist

## Audio Architecture

Status: Implemented locally on `codex/creator-note-info-surface`.

Creator Note introduces a second audio role. One shared audio-focus coordinator owns these rules:

- The cover and spoken note never play simultaneously
- Starting one pauses or stops the other as specified
- Cover progress is preserved while a spoken note plays
- Spoken audio never participates in song navigation or queue state
- Leaving the note context pauses the spoken note
- No automatic cover resume occurs after a spoken note ends

Avoid duplicating a second global song store for spoken-note audio. The note player should have a smaller state surface and use the shared focus boundary.

## Mobile Interaction

- Use axis-locked gesture handling for page swipes
- Preserve native vertical scrolling and child horizontal controls
- Keep transformations interruptible and limited to compositor-friendly properties
- Avoid permanent `will-change`; enable it only when an observed frame issue justifies it
- Provide reduced-motion behavior and bottom-navigation equivalence

## Performance

- Measure real first-play latency and playback failures before architectural optimization
- Keep share pages server-rendered and usable before full player hydration
- Lazy-load spoken-note audio and future theme assets
- Prevent visual themes from delaying primary text, cover controls, or lyrics
- Review bundle cost when gesture or theme libraries are introduced

## Storage And Asset Safety

- Add manifest backup and restore
- Track primary cover and spoken-note assets separately
- Make replacement and deletion idempotent where possible
- Add orphan detection before automatic cleanup
- Treat public visibility and storage privacy as separate concerns

## Observability

- Record playback load failures without logging sensitive asset credentials
- Track publish, upload, and manifest-save failures
- Add lightweight product events for first play, track share, Creator Note play, and successful publish
- Prefer evidence from real owner and listener usage over speculative performance work
