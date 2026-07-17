# Creator Note And Track Sharing

## Status

Product semantics accepted. Creator Note data and admin authoring are deployed. The information story surface and shared audio-focus behavior are implemented locally on `codex/creator-note-info-surface`; track sharing remains the next phase.

## Purpose

Attach a personal story to each full cover recording. The story can combine written reflection and an optional spoken recording, presented inside Sonic IDE and on a standalone share page.

The cover recording is the work. The spoken Creator Note is editorial context.

## Content Model

```ts
type CreatorNote = {
  body?: string;
  language?: LegacyLanguage;
  audioUrl?: string;
  audioDuration?: number;
  audioTranscript?: string;
};
```

The first version supports one text body and one spoken recording. Do not introduce generic rich-content blocks, arbitrary HTML, or multiple spoken clips before real use requires them.

## Audio Semantics

### Cover recording

- Uses `Song.audioUrl`
- Appears in the global player, queue, playback sequence, shuffle, repeat, and lyrics
- Preserves the existing song-player model

### Spoken Creator Note

- Uses `Song.creatorNote.audioUrl`
- Appears only in the information and share-story contexts
- Never becomes a `Song`
- Never enters the queue or playback sequence
- Does not use shuffle, repeat, next, or previous actions

## Audio Focus Rules

1. Starting the spoken note pauses the cover and preserves its current position
2. Starting or resuming the cover stops the spoken note
3. Leaving the Info surface or share-story context pauses the spoken note
4. Finishing the spoken note does not automatically resume the cover
5. After the note ends, the interface offers an explicit “Continue playing the song” action
6. Starting another track stops the spoken note
7. The two audio roles never play simultaneously

## Information Surface

Recommended hierarchy:

1. Track title and original-artist credit
2. Current cover/performance identity
3. Creator Note heading
4. Inline spoken-note card when present
5. Personal writing
6. Optional transcript disclosure
7. Tags and secondary metadata
8. Share action

Remove the generated waveform from this hierarchy. It should not compete with personal narrative.

The spoken-note card needs:

- Play and pause
- Progress and duration with tabular numerals
- A minimum 40px control target
- A clear state when the cover was paused
- An explicit continue-cover action after completion

Tracks without a Creator Note should show concise credits, tags, and metadata without rendering empty note chrome.

## Admin Authoring

The admin workflow supports:

- Creator Note text editing
- Language selection
- Spoken-note upload
- Lightweight microphone recording
- Preview, pause, retry, replacement, and removal
- Optional transcript entry
- Complete-work preview before publication

Reuse low-level recorder primitives. Do not reuse the full accompaniment and teleprompter workspace as the spoken-note UI.

Implementation boundary:

- Text, language, optional transcript, and spoken-audio metadata are stored in the flat playlist manifest
- New drafts default to `performanceType: "cover"`; legacy tracks remain valid without story fields
- Spoken uploads use the dedicated `creator-notes/` asset prefix
- Upload, browser recording, preview, retry, replacement, and manifest removal live inside the track form
- Replacing or removing a manifest reference does not automatically delete the old object; asset cleanup remains explicit lifecycle work

## Share Page

The track share page is a focused presentation rather than a full IDE clone.

It includes:

- Server-rendered title, credits, and story summary
- Full cover playback
- Creator Note text and optional spoken-note player
- The same audio-focus behavior as the IDE information surface
- Localized metadata and social previews
- An action to open the track inside Sonic IDE

The information surface and share page should share a `TrackStory` presentation model or component. Layout may differ, but content and audio rules must not diverge.

## Routing And Visibility

- Prefer a stable localized route such as `/{locale}/track/{shareSlug}`
- Fall back to ID when a slug is unavailable or ambiguous
- Only `public + ready` tracks receive public pages and sitemap entries
- Private, unlisted, draft, archived, or missing tracks must not leak story content through metadata
- Public copy-link actions point to the track route, never the R2 object URL

## Accessibility

- Written text and spoken transcript are separate concepts
- A transcript is optional in the first phase but should be supported by the model and UI
- Playback controls need visible focus, 40px minimum targets, and non-color state cues
- Creator Note audio must not autoplay
- Dynamic status changes should be announced without repeatedly reading the whole story

## Acceptance Checklist

- [x] Existing songs work without Creator Note fields
- [x] Text-only, spoken-only, and combined notes render correctly
- [x] The song and spoken note never overlap
- [x] The song position survives a spoken-note session
- [x] Leaving Info pauses spoken audio
- [x] Spoken audio never appears in song navigation
- [ ] Share pages render without the full IDE shell
- [ ] Copy link returns a track page URL
- [ ] Private or draft story content is not exposed publicly
