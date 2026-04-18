# Implementation Plan

## Goal

Turn the current product and roadmap documents into a concrete sequence of `feat/*` branches that can be developed from `dev`, accepted independently, and merged back without mixing concerns.

## Working Rule

Every branch below is intended to start from `dev` and merge back into `dev` only after its own local acceptance is complete.

## Phase 1: Documentation Baseline

Branch:

- `feat/docs-foundation`

Scope:

- Define product positioning
- Define branching and release workflow
- Define current architecture baseline
- Define first-pass roadmap for admin, features, and engineering
- Define the first draft of the library model and recording/export direction

Acceptance:

- `README.md` reflects the current product identity
- `docs/` provides a navigable planning baseline
- Product direction, branch policy, and next implementation steps are documented clearly enough to guide later feature branches

## Phase 2: Library Classification

Branch:

- `feat/library-classification`

Scope:

- Extend the track model with explicit classification fields such as portfolio vs personal
- Update admin forms and storage handling to capture those fields
- Ensure the player can still render older entries safely
- Add minimal UI treatment or filtering hooks if needed, without redesigning the full player

Dependencies:

- `feat/docs-foundation`

Acceptance:

- A track can be classified during admin creation or editing
- Existing tracks still load without breaking playback
- New fields are documented and handled in a backward-compatible way
- Type-check passes for the updated model

## Phase 3: Admin Recording Shell

Branch:

- `feat/admin-recording-shell`

Scope:

- Add an admin-only recording UI shell
- Support recording start, stop, preview, discard, and retry
- Keep the captured result in memory or temporary client state before persistence
- Define the handoff from recorded audio to normal track creation flow

Dependencies:

- `feat/docs-foundation`
- Preferably after `feat/library-classification`, so recordings can carry source metadata cleanly

Acceptance:

- Admin can record audio in the browser
- Admin can preview the recorded result before saving
- Failed or denied recording states are handled without breaking the page
- No public route exposes recording controls

## Phase 4: MP3 Export Foundation

Branch:

- `feat/export-mp3-foundation`

Scope:

- Add the first MP3 export path for recorded or managed tracks
- Define where export is triggered in the admin workflow
- Handle conversion status, failure states, and result delivery
- Keep the implementation narrow to one format and one coherent flow

Dependencies:

- `feat/admin-recording-shell` if export starts with recordings
- Potential backend support, depending on whether export is browser-side or server-side

Acceptance:

- An admin can complete one full MP3 export flow
- Export failure states surface useful feedback
- Export logic is narrow and documented rather than trying to solve all formats at once

## Phase 5: Lyrics Workflow Expansion

Branch:

- `feat/lyrics-workflow`

Scope:

- Improve lyric import resilience
- Clarify lyric editing and replacement behavior
- Separate lyric states such as missing, imported, or manually edited if needed

Dependencies:

- `feat/library-classification` is optional
- Can proceed independently if it does not touch the richer track model

Acceptance:

- Admin can import or edit lyrics with clearer outcomes
- Public lyric rendering remains stable
- The lyric workflow is documented and locally verifiable

## Phase 6: Backend Media Foundation

Branch:

- `feat/backend-media-foundation`

Scope:

- Prepare backend APIs and storage behavior for recording and export flows
- Clarify asset persistence responsibilities
- Reduce coupling between public playback APIs and admin media management

Dependencies:

- Should follow whichever branch first proves the recording/export path

Acceptance:

- Media-oriented backend responsibilities are clearer and more modular
- New flows no longer rely on ad hoc handling in unrelated endpoints
- Storage and URL handling are documented and testable

## Phase 7: CI/CD And Quality Gates

Branch:

- `feat/cicd-foundation`

Scope:

- Add automated validation for install, lint, type-check, test, and build
- Define merge-readiness expectations for `feat/*`, `dev`, `main`, and `live`
- Make release synchronization more repeatable

Dependencies:

- Can start early, but works best after the first few feature branches expose real project pain points

Acceptance:

- Core validation runs automatically
- The workflow reinforces the branch model instead of bypassing it
- Release movement from `dev` to `main` to `live` becomes easier to repeat safely

## Recommended Immediate Order

1. Finish and accept `feat/docs-foundation`
2. Build `feat/library-classification`
3. Build `feat/admin-recording-shell`
4. Build `feat/export-mp3-foundation`
5. Decide whether `feat/lyrics-workflow` or `feat/backend-media-foundation` comes next based on actual blockers
6. Add `feat/cicd-foundation` once the feature path is clearer
