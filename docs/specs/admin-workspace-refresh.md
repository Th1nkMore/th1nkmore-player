# Admin Workspace Refresh

This note documents the April 2026 refresh of the admin upload and playlist-editing workspace.

## Checklist

- [x] Phase 1: Admin workspace shell and shared card primitives
- [x] Phase 2: Upload workspace refactor with token tag input and status sidebar
- [x] Phase 3: Playlist master-detail editor with mobile drawer detail view
- [x] Phase 4: Internationalization, responsive layout, and subtle motion
- [x] Phase 5: Error handling, helper tests, and release validation

## Summary

- The admin area now uses a workspace-card layout instead of long stacked forms.
- Upload keeps all existing capabilities while adding better readiness feedback, file status, and summary notices.
- Playlist editing now uses a searchable master-detail layout with staged draft edits and explicit discard/delete confirmation.
- A later 2026-07-19 product decision retired the full-cover recording tab after `.coverpkg` import landed; Creator Note recording remains embedded in the shared story fields.

## Engineering Notes

- Shared workspace UI lives under `src/components/admin/workspace`.
- Page-level orchestration moved into `useAdminPageController`.
- New admin copy is localized in `en`, `zh`, `ja`, and `de`.
- Helper logic for upload readiness and draft dirty-state checks lives in `src/lib/admin-workspace.ts`.

## October 2026: Task-focused admin workbench

The admin now opens on the song library. A persistent, collapsible navigation rail separates Songs, Add song, and Albums & tags; narrow screens use a compact horizontal navigation. Shared admin tokens provide light and dark themes without changing the public player's styling. The language selector keeps `/admin` in place and supports the existing four locales.

- Song editing uses Details, Lyrics, Creator note, and Publishing tabs. The list can be resized by pointer or keyboard; saving stays outside the scrolling content. Optional missing metadata is described as optional, rather than a publication error.
- Add song uses Choose file → Song details → Review & publish. Required fields report errors inline and receive focus. Files, lyrics, and metadata remain in the draft between steps. Step changes reset the scroll position and focus the new content, preventing the Continue button from becoming a focused Publish action.
- Unpublished and private entries use “Save to library”; public ready entries use “Publish song”. Drafts can be cleared explicitly with confirmation.
- Switching songs or leaving the editor offers Save, Discard, and Cancel. Refreshing or closing protects unsaved drafts. Bulk actions and reorder are paused while the selected song has unsaved changes. Invalid title/artist edits cannot reach the write API. Reloading a stale library version is an explicit action and confirms before replacing an unsaved song draft.
- Optional audio, revisions, archive, and history tools are grouped in one disclosure. Mobile editors have a visible return button and a stable save footer.
- Albums and tags are searchable. Renaming happens in a focused dialog, so an unsubmitted name cannot be lost through background navigation. Album ordering and tag merging keep their existing persistence behavior.
- Login uses a compact, localized password form, readable errors, and the same appearance controls. Authentication and storage contracts remain unchanged.
- Activity is an optional localized disclosure. Routine logs no longer open the tray automatically or compete with the active task.
- Metadata reads use the existing import sequence to ignore stale results after replacing or clearing a file. File intake, lyric fetching, publication, and spoken-note work prevent conflicting navigation/actions.

The existing Tailwind, next-intl, Radix Dialog, and resizable-panel primitives are reused. Song editor, publishing fields, catalog rename, library overview, and asset tools have separate components to stay within the repository's 500-line limit.

### Acceptance scope

Browser acceptance covers the loaded library, search empties, editing required fields, upload file selection and draft retention, publication review, clearing drafts, unsaved-change confirmation, dialog Escape/focus restoration, keyboard tabs and panel resizing, catalog search/rename cancellation, desktop/mobile reflow, and theme/language switching. Local synthetic audio is used for upload review; acceptance does not publish test content to R2 or modify the owner's saved songs. Real microphone capture and external storage writes remain covered by their existing implementations and tests, rather than being exercised against the owner's live library.

### Player design-language alignment

The admin now inherits the player's `background`, `sidebar`, `foreground`, `primary`, `accent`, `border`, and semantic log colors through aliases. It uses the same monospace typography and defaults to the same dark theme. Muted and warning text blends the shared colors toward foreground for form readability. No independent blue palette remains.

Navigation and editor tabs use neutral selection backgrounds, library rows use the player's narrow active marker, and toolbars, form panels, buttons, and the Sonic IDE wordmark follow the existing editor surfaces. The three-step upload workflow, draft protections, keyboard paths, and fixed save controls are retained. Browser checks cover 1440px desktop and 320px mobile layouts in light/dark and Chinese/English.
