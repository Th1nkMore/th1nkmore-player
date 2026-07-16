# Library And Story Model

## Goal

Keep one compatible song library while evolving a public track from a flat playlist row into a shareable cover story.

The current `Song` model remains the playback contract. New story fields should be optional and backward-compatible so existing tracks continue to load without migration blockers.

## Existing Classification

The current model already includes:

- `trackType`: `portfolio` or `personal`
- `sourceType`: `upload`, `recording`, or `external-upload`
- `visibility`: `public`, `private`, or `unlisted`
- `assetStatus`: `draft`, `ready`, or `archived`

These fields answer why an item exists, where its primary audio came from, and whether it should be discoverable. They do not describe authorship or the story attached to the cover.

## Planned Cover Semantics

The primary `audioUrl` is the complete song recording used by the global player, queue, lyrics, and playback sequence.

Planned fields should clarify cover credits and sharing:

- `performanceType`: initially `cover`, with room for `original` or `listening`
- `originalArtist`: the credited original performer or author label shown to listeners
- `shareSlug`: a stable human-readable share identifier when one is available

These fields should not overload `trackType`. Portfolio-versus-personal and cover-versus-original answer different questions.

## Creator Note

A track may contain a Creator Note displayed as “翻唱者说” for covers.

```ts
type CreatorNote = {
  body?: string;
  language?: LegacyLanguage;
  audioUrl?: string;
  audioDuration?: number;
  audioTranscript?: string;
};
```

Rules:

- Text and spoken audio are independently optional, but an empty object is not meaningful
- `body` is the personal essay, not necessarily a transcript
- `audioTranscript` is an optional accurate transcript for accessibility and search
- Creator Note audio is never a queue item and never appears in the playback sequence
- Playing Creator Note audio pauses the cover and preserves the cover position
- Ending the spoken note does not automatically resume the cover
- Leaving the information or share context pauses the spoken note

## Information And Share Surfaces

The mobile information page and the standalone share page should render the same story data through a shared content component.

The IDE information surface may be narrower and more contextual. The share page should be a focused reading and listening experience with server-rendered metadata, social previews, and an action to open the work inside Sonic IDE.

## Future Visual Theme

After the story and sharing model is stable, a track may opt into a curated visual preset:

```ts
type VisualTheme = {
  preset: "terminal" | "memory" | "night-drive" | "paper";
  accent?: string;
  backgroundImageUrl?: string;
  motion?: "none" | "subtle" | "immersive";
};
```

The first version should not accept arbitrary CSS or JavaScript. Every preset needs a reduced-motion fallback and a mobile performance budget.

## Storage Boundary

The flat R2 `playlist.json` remains adequate for the current catalog size. A database should only be introduced when editing, querying, or asset lifecycle requirements clearly exceed the manifest model.

Deleting a playlist entry and deleting its R2 audio objects are separate operations and should remain explicit. Creator Note audio must eventually participate in backup, replacement, orphan detection, and deletion workflows.
