# Lyrics Sync Hardening

## Scope

This note documents the April 2026 hardening pass for timed lyrics import and the admin recording teleprompter.

## Behavior Changes

- Timed lyric parsing now ignores leading metadata cues before the first real lyric line.
- Timestamp detection is now stateless, so repeated lyric-format checks do not flip between `lrc` and `plain`.
- NetEase lyric import now uses the shared LRC normalization path instead of its own ad-hoc filtering.
- The recording teleprompter now follows accompaniment time only after the audio metadata is ready.
- Auto-follow scrolling now uses a deterministic target scroll position instead of repeated smooth scrolling, reducing end-of-song jitter.

## Regression Coverage

- `tests/lib/lrcParser.test.ts` covers leading metadata removal and repeated timestamp detection.
- `tests/api/admin/fetch-lyrics.test.ts` covers shared normalization for fetched lyrics.
- `tests/lib/recordingSession.test.ts` uses mock accompaniment state to verify timeline fallback behavior.
- `tests/components/admin/LyricTeleprompter.test.ts` covers the stabilized auto-scroll calculation.
