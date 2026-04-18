# Recording And Export Spec Draft

## Scope

This document defines the first practical design direction for two future admin capabilities:

- In-browser recording
- Audio export, with MP3 as the first target

## User Role

The primary user is the trusted owner or administrator of Sonic IDE.

This is not a public recording tool for arbitrary visitors. The feature should be designed around a single-owner workflow first.

## Recording Goals

- Record audio directly in the browser
- Preview the result before saving
- Save the recording as a library item
- Continue editing metadata and lyrics after recording
- Export the recording to MP3

## Recording Flow

1. Open the admin workspace
2. Start a recording session
3. Monitor recording state and elapsed time
4. Stop recording
5. Preview the captured audio
6. Choose to discard, retry, save as draft, or publish into the library
7. Edit metadata and lyrics if needed

## Recording States

- Idle
- Recording
- Stopped
- Previewing
- Saving
- Failed

## Recording Output

The first saved result should behave like a normal managed track with extra source metadata indicating that it was recorded in-app.

At minimum, a saved recording should retain:

- Temporary local blob for preview before upload
- Uploaded asset URL after persistence
- Core metadata such as title, artist, album, duration, and language
- Source classification indicating `recording`

## Export Goals

- Export to MP3 first
- Make later formats possible without redesigning the workflow
- Keep export entry points consistent between uploaded tracks and recorded tracks where possible

## Export Flow

1. Select an existing managed track or newly recorded draft
2. Choose export format
3. Start conversion
4. Wait for completion or failure
5. Download or store the exported result

## Product Decisions Still Open

- Whether export is browser-side, server-side, or hybrid
- Whether exported files are transient downloads or saved as managed assets
- Whether export applies only to recordings in phase one or to all tracks
- Whether a recording must be saved before export is allowed

## Recommended Implementation Order

1. Add a recording UI shell and state model
2. Persist recorded audio as a managed track
3. Add MP3 export for the recorded flow
4. Expand export support to other track sources and formats
