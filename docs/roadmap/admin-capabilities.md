# Admin Capabilities Roadmap

## Goal

Evolve the admin area into a safe single-owner publishing workspace for full cover recordings and their personal story content.

## Current Baseline

- Upload song audio to R2
- Edit playlist entries and ordering
- Manage lyrics, tags, classification, visibility, and asset status
- Record full performances with accompaniment and lyric support
- Preview, retry, and hand recorded audio into the normal upload flow
- Export newly recorded audio to MP3 in the browser

## Next: Creator Note Authoring

- Edit Creator Note text as readable paragraphs
- Set the language of the personal writing
- Upload an existing spoken note
- Record a short spoken note through a lightweight microphone UI
- Preview, pause, retry, replace, and remove spoken-note audio
- Store duration and an optional transcript
- Preview the complete information/share presentation before publishing

The spoken-note recorder should reuse low-level microphone capture but not the full accompaniment, teleprompter, or performance-recording workspace.

## Next: Cover Credits And Sharing

- Distinguish the owner-performed cover from the original artist credit
- Assign or generate a stable share slug
- Preview localized track metadata and social sharing text
- Make public copy-link behavior point to the track page

## Next: Asset Lifecycle

- Back up and restore the manifest
- Replace primary cover audio safely
- Replace or remove spoken-note audio safely
- Distinguish manifest removal from R2 object deletion
- Detect orphaned song and spoken-note assets
- Surface publish and storage failures clearly

## Deferred

- Additional export formats
- Batch conversion and quality presets
- Generalized processing for every managed asset
- Multi-user approvals or audit roles
- Public authoring and uploads

## Open Decisions To Revisit Later

- Whether every public cover requires a Creator Note
- Whether an accurate spoken-note transcript should become required for accessibility
- Whether Creator Note revisions need history beyond manifest backups
- Whether visual themes are selected during authoring or in a separate presentation step
- Whether private personal listening content justifies signed media delivery
