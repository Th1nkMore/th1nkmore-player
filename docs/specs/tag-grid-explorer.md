# Tag Grid Explorer

## Goal

Add playlist-backed song tags that are managed in admin and consumed in the public listener UI through a VS Code-style Grid explorer for bulk random queue building.

## Progress

- [x] Phase 1: Data model and playlist API compatibility
- [x] Phase 2: Admin tag input for upload and edit flows
- [x] Phase 3: Desktop Files/Grid explorer switch and lyrics collapse
- [x] Phase 4: Internationalization and mobile adaptation
- [x] Phase 5: Tests and regression coverage

## Data Model

- `Song.tags` is a first-class `string[]` field.
- `playlist.json` remains the only persisted source of truth.
- Tags are normalized by trimming and deduplicating within a song while preserving display casing.

## Admin Flow

- Upload and playlist edit screens now share a chip-based tag input.
- Suggested starter tags remain `Rap`, `R&B`, `Soul`, and `Rock`.
- Admin can add custom tags, remove tags per song, and save through the existing playlist pipeline.

## Listener Flow

- Desktop left sidebar now supports `Files` and `Grid` views.
- `Grid` visualizes tag availability using responsive tiles sized by remaining available songs.
- Clicking a tile appends a random 5 songs from that tag by default, with `+10`, `+20`, and `All` shortcuts.
- Remaining tag counts recalculate after each queue append.

## Responsive Notes

- Desktop uses an activity bar plus the Grid explorer.
- Mobile keeps the existing songs area but adds a segmented `Files / Grid` switch.
- Mobile Grid falls back to a compact card grid rather than a dense treemap-style layout.

## Testing

- Tag normalization and aggregation are covered in `tests/lib/tags.test.ts`.
- Queue batch appends are covered in `tests/store/usePlayerStore.test.ts`.
- Playlist route compatibility with normalized tags is covered in `tests/api/admin/playlist.test.ts`.
