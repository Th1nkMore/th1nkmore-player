# Recording And Export Spec Draft

## Scope

This document defines the first practical design direction for two future admin capabilities:

- In-browser recording
- Audio export, with MP3 as the first target

Implementation note:

The current codebase already includes an admin-only recording workspace, client-side microphone capture, preview, save-to-library flow, and browser-side MP3 export for newly recorded audio. This document therefore serves as both a spec and a gap list for the remaining decisions.

## User Role

The primary user is the trusted owner or administrator of Sonic IDE.

This is not a public recording tool for arbitrary visitors. The feature should be designed around a single-owner workflow first.

## Recording Goals

- Record audio directly in the browser
- Preview the result before saving
- Save the recording as a library item
- Continue editing metadata and lyrics after recording
- Export the recording to MP3

## Current Phase Acceptance

The current phase should be considered accepted when all of the following are true:

- An authenticated admin can start and stop microphone recording in the browser
- The captured result can be previewed before persistence
- The recording can be discarded or retried without breaking the workspace
- The recording can be handed off into the normal library persistence flow
- The recording can be saved as a managed library item with `sourceType: recording`
- The recording can be exported to MP3 in the browser with visible success or failure feedback

This acceptance is intentionally narrower than the long-term product direction. It defines the minimum coherent recording and export workflow that already exists in the current implementation.

## Recording Flow

1. Open the admin workspace
2. Start a recording session
3. Monitor recording state and elapsed time
4. Stop recording
5. Preview the captured audio
6. Choose to discard, retry, save into the library, or later split the flow into draft versus publish if the product requires it
7. Edit metadata and lyrics if needed

## Recording States

- Idle
- Recording
- Stopped
- Previewing or preview-ready UI state
- Saving or save-in-progress UI state
- Failed

Current implementation note:

The current hook-level recording state is still lightweight and models `idle`, `recording`, `stopped`, and `failed`. Preview and saving are currently represented at the workspace/UI level rather than as first-class recorder states.

Acceptance note:

For the current phase, this lightweight split is acceptable. A stricter unified state model should only become required if it materially improves draft handling, recovery behavior, or backend processing.

## Recording Output

The first saved result should behave like a normal managed track with extra source metadata indicating that it was recorded in-app.

At minimum, a saved recording should retain:

- Temporary local blob for preview before upload
- Uploaded asset URL after persistence
- Core metadata such as title, artist, album, duration, and language
- Source classification indicating `recording`

Current implementation note:

The current save flow already persists recordings as normal library items with `sourceType: recording`, and can optionally attach accompaniment metadata.

## Export Goals

- Export to MP3 first
- Make later formats possible without redesigning the workflow
- Keep export entry points consistent between uploaded tracks and recorded tracks where possible

## Export Flow

1. Select an exportable source
2. In the current phase, this is a newly recorded in-memory result
3. In a later phase, this may expand to existing managed tracks
4. Choose export format
5. Start conversion
6. Wait for completion or failure
7. Download or store the exported result

## Product Decisions Still Open

- Whether export is browser-side, server-side, or hybrid
- Whether exported files are transient downloads or saved as managed assets
- Whether export applies only to recordings in phase one or to all tracks
- Whether a recording must be saved before export is allowed

Current implementation note:

The current implementation answers some of these questions provisionally:

- Export is browser-side
- Export currently applies to newly recorded audio
- Export currently results in a download rather than a managed stored asset
- A recording does not need to be saved before export

## Deferred Items

The following items are explicitly deferred beyond the current phase:

- Distinguishing draft versus published recordings in the saved asset model
- Exporting already-managed library tracks instead of only newly recorded audio
- Persisting exports back into managed storage
- Supporting additional export formats or presets
- Moving conversion from browser-side to a backend or hybrid pipeline

## Recommended Implementation Order

1. Accept the existing recording UI shell and state model, or tighten it if draft and publish states are required
2. Accept the existing persistence flow for recorded audio as a managed track
3. Accept the existing MP3 export flow for newly recorded audio
4. Expand export support to other track sources and formats
