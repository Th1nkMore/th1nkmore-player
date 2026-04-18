# Library Model

## Goal

Keep Sonic IDE as one player with one library, while still distinguishing why a track exists in the system.

The app should not split into a "portfolio product" and a separate "music player product". Instead, the library should support different track categories inside a unified listening experience.

## Track Categories

The first version of the library model should recognize two primary categories:

1. Portfolio tracks
2. Personal listening tracks

Portfolio tracks are songs that represent the owner's own work and should be easier to feature, curate, and present as part of the public-facing identity of the project.

Personal listening tracks are songs the owner uploads for personal playback inside the same interface. They still behave like playable library items, but they do not need the same portfolio emphasis.

## Product Behavior

Both categories should:

- Appear in the same core player experience
- Support playback, queueing, lyrics, and metadata
- Reuse the same library browsing patterns

The distinction should mainly affect:

- Filtering and browsing
- Default visibility and curation
- Admin workflows
- Future analytics or reporting

## Minimum Metadata Direction

The current codebase models a track with a simple `Song` type. That is acceptable for the current phase, but future iterations should add explicit metadata that answers these questions:

- What category does this track belong to
- Where did this track come from
- Is this track intended for public portfolio presentation
- Was this track uploaded directly, recorded in-app, or generated from export

## Suggested Future Fields

These fields do not need to be implemented immediately, but they should guide future branch work:

- `trackType`: `portfolio` or `personal`
- `sourceType`: `upload`, `recording`, or `external-upload`
- `visibility`: `public`, `private`, or `unlisted`
- `assetStatus`: `draft`, `ready`, `archived`

## Current Constraint

Right now, the app mainly stores flat song records with fields such as title, artist, album, duration, lyrics, audio URL, metadata, and language. The next steps should extend that shape carefully without breaking existing playback and admin flows.
