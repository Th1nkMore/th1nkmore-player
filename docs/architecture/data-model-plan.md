# Data Model Plan

## Implementation Status

The optional cover-credit, sharing-identity, and Creator Note fields are deployed. Legacy normalization remains compatible. Public story presentation and audio focus are implemented locally on `codex/creator-note-info-surface`; stable track routes remain the next data consumer.

## Current State

The current `Song` interface already supports playback, lyrics, tags, and first-pass classification:

- Identity: `id`, `title`, `artist`, `album`, `language`
- Playback: `duration`, `audioUrl`, `lyrics`
- Discovery: `tags`, `metadata`
- Classification: `trackType`, `sourceType`, `visibility`, `assetStatus`

The model is stored as a flat R2 playlist manifest and normalized for backward compatibility.

## Next Product Questions

The agreed direction requires the model to represent four additional facts:

1. The primary audio is the owner's complete cover recording
2. The original work needs separate credit from the performer field
3. A cover may include personal writing and an optional spoken Creator Note
4. The work needs a stable share identity and, later, an optional visual preset

## Proposed Optional Fields

```ts
type PerformanceType = "cover" | "original" | "listening";

type CreatorNote = {
  body?: string;
  language?: LegacyLanguage;
  audioUrl?: string;
  audioDuration?: number;
  audioTranscript?: string;
};

type VisualTheme = {
  preset: "terminal" | "memory" | "night-drive" | "paper";
  accent?: string;
  backgroundImageUrl?: string;
  motion?: "none" | "subtle" | "immersive";
};

type SongStoryFields = {
  performanceType?: PerformanceType;
  originalArtist?: string;
  shareSlug?: string;
  creatorNote?: CreatorNote;
  visualTheme?: VisualTheme;
};
```

`visualTheme` is intentionally later-phase work. The first migration should focus on credits, sharing identity, and Creator Note content.

## Audio Roles

The model must preserve two separate audio roles:

- `audioUrl`: complete cover recording controlled by the global song player
- `creatorNote.audioUrl`: spoken editorial audio controlled by an inline note player

Creator Note audio is not converted into a `Song`, queued, shuffled, repeated, or included in song navigation. The shared audio-focus coordinator pauses or stops the other role before playback begins.

## Transition Strategy

1. Add new fields as optional and preserve existing normalization defaults
2. Update the admin form and API validation before public rendering depends on the fields
3. Add Creator Note text authoring before spoken recording
4. Reuse low-level microphone capture for spoken notes, not the full accompaniment/teleprompter UI
5. Add the information page and audio-focus behavior
6. Add track routes and share metadata
7. Migrate selected published tracks gradually rather than blocking on a catalog-wide conversion
8. Add visual themes only after content and sharing acceptance

## Validation Direction

- Reject a Creator Note with no text, no spoken audio, and no transcript
- Clamp durations and normalize URLs through the same storage boundary as song assets
- Treat transcripts as optional content, not a substitute for the personal essay
- Keep raw R2 URLs out of public share actions
- Keep playlist deletion and object deletion separate and auditable

## Database Decision

Do not introduce a database solely for Creator Notes. Revisit storage only when concurrent editing, querying, revision history, or asset relationships become painful in the manifest model.
