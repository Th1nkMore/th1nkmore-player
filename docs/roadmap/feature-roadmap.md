# Feature Roadmap

## Product Outcome

Sonic IDE should let the owner publish a complete cover recording, explain the personal meaning of the song through writing and optional spoken audio, and share the resulting work as part of a coherent personal portfolio.

## Priority 1: Mobile Navigation

Status: Implemented; physical touch-device acceptance remains.

- [x] Add horizontal swipe paging between Lyrics, Songs, and Info
- [x] Keep bottom navigation visible and synchronized
- [x] Preserve state across page switches
- [x] Resolve conflicts with horizontal scrollers and playback controls in the gesture model
- [x] Respect reduced-motion preferences

## Priority 2: Creator Note Authoring

Status: Implemented locally on `codex/creator-note-authoring`; not deployed.

- [x] Add personal writing to a track
- [x] Upload or record an optional spoken note
- [x] Preview, replace, and remove spoken-note audio
- [x] Keep spoken-note recording separate from full cover recording
- [x] Support an optional accurate transcript without requiring one for publication

## Priority 3: Information Story Experience

- Remove the generated waveform from the information hierarchy
- Present cover credits, personal writing, and spoken-note audio
- Guarantee one audio focus across song and spoken note
- Use a full reading surface on mobile and a scrollable narrative surface on desktop
- Provide a useful metadata fallback for tracks without a Creator Note

## Priority 4: Track Sharing

- Add localized, stable track URLs
- Render shareable story pages with social metadata
- Reuse Creator Note presentation across the IDE and share page
- Copy track-page links rather than object-storage URLs
- Open a shared work inside the full Sonic IDE player

## Priority 5: Playback Continuity

- Restore safe session state across visits
- Add Media Session integration
- Evaluate installable web behavior based on actual owner usage

## Priority 6: Curated Visual Expression

- Add a small set of per-track theme presets
- Share visual tokens between the player and track page
- Support accents, background assets, and constrained motion
- Guarantee readable, reduced-motion, and mobile fallbacks

## Continuous: Publishing Safety

- Back up and restore the manifest
- Improve song and spoken-note asset replacement and deletion
- Detect orphaned objects
- Strengthen remote release gates
- Monitor playback and publishing failures

## Explicitly Parked

- Multi-user behavior
- Public uploads
- Music-source plugin ecosystem
- Generic embed SDK
- More export formats
- Full media-processing backend
- Desktop wrappers
- More locales
