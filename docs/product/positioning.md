# Sonic IDE Positioning

## Product Summary

Sonic IDE is a personal cover portfolio and audio journal wrapped in an IDE-like listening interface.

The owner publishes full cover recordings, synchronized lyrics, and personal context about each song. Public listeners can browse, play, read, listen to an optional spoken Creator Note, and share an individual work. The IDE metaphor is the interaction language; the product category remains a personal music portfolio and player.

## Core Content Unit

The core public unit is a track entry containing some or all of the following:

1. The owner's full cover recording
2. Lyrics and synchronized playback data
3. Song credits and source metadata
4. A Creator Note made from personal writing and an optional spoken recording
5. A future curated visual theme

The full cover is the song audio used by the global player, queue, and playback sequence. The spoken Creator Note is editorial audio attached to the story. It never enters the song queue and must not play at the same time as the cover.

## Users And Jobs

### Owner

- Publish and manage full cover recordings
- Attach lyrics, credits, tags, and personal writing
- Record or upload a short spoken Creator Note
- Preview the complete work before publishing
- Share a stable track page rather than a raw audio-object URL

### Public listener

- Discover a song through the library or a shared track link
- Listen to the full cover and follow the lyrics
- Read or listen to why the song matters to the owner
- Continue into the broader Sonic IDE library

## Product Shape

The public product has two complementary surfaces:

- The IDE player is the immersive browsing and listening environment
- The track share page is a focused, server-rendered presentation of one work

The admin product is a single-owner publishing workspace, not a collaborative CMS or public upload portal.

## Non-Goals

- Multi-user accounts or public uploads
- A public marketplace or source-plugin ecosystem
- Arbitrary third-party music-source adapters
- A general-purpose embeddable player SDK
- A desktop wrapper before installable web behavior proves insufficient
- A full DAW or generalized media-conversion platform
- Arbitrary user-authored CSS or JavaScript themes

## Product Principles

- Personal voice first: writing and spoken context should make the cover more meaningful
- Player first: audio behavior must remain predictable and resilient
- One audio focus: the song and spoken Creator Note never play simultaneously
- Share the work, not the asset: public actions should copy a track page rather than the R2 URL
- IDE language, not IDE burden: visual metaphor must not override music-player semantics
- Single-owner workflow: publishing should be safe and efficient for one trusted operator
- Curated expression: later visual themes should be opinionated presets with accessible fallbacks

## Current Boundary

The current implementation already provides the player, lyrics, responsive navigation, admin uploads, editing, recording, and deployment. Creator Notes, mobile swipe paging, track share pages, playback persistence, and per-track visual themes remain roadmap work.

Visibility settings currently filter discovery in the public UI and API. Public R2 URLs are not storage-level access control; confidential assets require private storage and signed or authenticated delivery.
