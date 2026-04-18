# Data Model Plan

## Current State

The current `Song` type is intentionally lightweight:

- `id`
- `title`
- `artist`
- `album`
- `duration`
- `lyrics`
- `audioUrl`
- `metadata`
- `language`

This is enough for the current player and admin upload flow, but it does not yet represent the product distinctions that now matter.

## Why The Model Needs To Evolve

The project now has a broader product direction:

- It is both a portfolio and a personal player
- It will support admin recording
- It will support export flows
- It will likely need stronger backend support around media processing

Those directions introduce state that should not be hidden indefinitely inside a generic `metadata` bag.

## Proposed Evolution

The next iterations should move toward a richer media entity while preserving backward compatibility with the current player.

Suggested additions:

- `trackType`
  - Distinguishes portfolio tracks from personal listening tracks
- `sourceType`
  - Distinguishes normal uploads from in-app recordings and later import paths
- `visibility`
  - Leaves room for portfolio curation and private-only listening
- `assetStatus`
  - Separates drafts, ready assets, and archived entries
- `coverImageUrl`
  - Prepares for richer presentation later
- `lyricsStatus`
  - Distinguishes missing, imported, edited, and verified lyrics
- `exportFormats`
  - Tracks available or generated export outputs

## Transition Strategy

1. Keep existing `Song` fields stable for playback compatibility
2. Add new optional fields behind non-breaking feature branches
3. Update admin forms before tightening any validation rules
4. Document migration expectations before introducing backend processing steps

## Short-Term Recommendation

The immediate next document-driven implementation branch should likely add explicit classification fields first, because that change affects both product semantics and future admin workflows.
