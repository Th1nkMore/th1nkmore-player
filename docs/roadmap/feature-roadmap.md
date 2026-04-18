# Feature Roadmap

## 1. Player And Library

- Preserve the current player-first experience
- Expand the library model to support both portfolio works and personal listening tracks
- Add metadata fields that help segment and curate these track types without splitting the product
- Keep both track categories available inside one unified playback surface

## 2. Lyrics

- Improve lyrics display quality and resilience
- Expand lyrics crawling and import options
- Provide clearer admin workflows for fixing, replacing, and storing lyrics

## 3. Recording

- Add in-browser recording
- Support preview, discard, retry, and save flows
- Connect recording output to library management and metadata editing
- Keep the recording path admin-only in the initial phase

## 4. Export

- Support MP3 export as the first explicit output target
- Extend export support to additional formats later
- Define export entry points in admin workflows
- Decide whether export is on-demand download, stored asset generation, or both

## 5. Backend Updates

- Strengthen media-oriented backend responsibilities
- Prepare for track processing, conversion, and richer metadata workflows
- Separate concerns more clearly between public playback APIs and admin media-management APIs

## Acceptance Strategy

Each feature area should be split into independently acceptable `feat/*` branches and merged into `dev` only after local acceptance.
