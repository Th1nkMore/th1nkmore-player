# External Cover Production Handoff

> Status: Accepted; implementation pending  
> Decision date: 2026-07-19  
> Companion document: HuangToolbar repository `docs/COVER_PRODUCTION_WORKFLOW.md`

## Purpose

This specification defines how finished cover recordings move from the local HuangToolbar and Audacity workflow into Sonic IDE.

The website is the review, publication, and archive endpoint. It is no longer intended to reproduce a full digital audio workstation in the browser.

## Product Decision

The owner currently creates covers through this sequence:

1. HuangToolbar discovers a NetEase Cloud Music download;
2. HuangToolbar decrypts the reference audio and prepares lyrics;
3. Audacity performs music separation, recording, editing, and mixing;
4. Audacity exports a lossless master and an MP3 publication copy;
5. HuangToolbar validates the publication copy and builds a `.coverpkg`;
6. Sonic IDE imports the package, lets the administrator review it, and publishes it through the existing upload pipeline.

This workflow supersedes the plan to make the website a full cover-recording environment. The existing Creator Note spoken-audio feature remains a separate, lightweight capability unless a later product decision changes it.

## Responsibility Boundary

### HuangToolbar

- Owns local project orchestration;
- prepares reference audio and lyrics;
- generates Audacity label files;
- validates Audacity exports;
- creates a privacy-safe publication package.

### Audacity

- Owns separation, recording, editing, effects, mixing, and mastering;
- owns the `.aup3` project and intermediate audio;
- exports the candidate publication file.

### Sonic IDE

- Parses and validates the publication package locally;
- maps package metadata into the admin upload form;
- lets the administrator review or edit public metadata and lyrics;
- reuses the existing signed upload and playlist persistence path;
- displays the published result.

## Package Contract

The import artifact uses the `.coverpkg` extension. It is a ZIP container with a strict allowlist.

### Version 1 layout

```text
manifest.json
audio/
  publish.mp3
lyrics/
  lyrics.lrc
checksums.json
```

Version 1 does not require artwork. Any future optional file must be introduced through a schema revision or a backwards-compatible optional field.

### Manifest

```json
{
  "schemaVersion": 1,
  "packageId": "pkg_01JZ...",
  "projectId": "cover_01JZ...",
  "title": "Song Title",
  "artist": "Huang",
  "originalArtist": "Original Artist",
  "album": "Cover",
  "audio": {
    "path": "audio/publish.mp3",
    "mimeType": "audio/mpeg",
    "durationSeconds": 243.52
  },
  "lyrics": {
    "path": "lyrics/lyrics.lrc",
    "format": "lrc"
  },
  "source": {
    "kind": "cover",
    "credit": "Cover of Song Title by Original Artist"
  },
  "createdAt": "2026-07-19T12:00:00+08:00"
}
```

### Field semantics

- `packageId`: unique identity for one package build; used for duplicate detection and retry safety;
- `projectId`: stable local cover-project identity; useful for grouping later versions;
- `title`: public title of this recording;
- `artist`: performer of this cover and the value mapped to the website's current `Song.artist` field;
- `originalArtist`: performer credited by the source recording; it must not overwrite `artist`;
- `album`: editable publication grouping, with `Cover` as a reasonable default;
- `source.kind`: `cover` for this workflow;
- `source.credit`: human-readable credit proposed by HuangToolbar and editable before deployment.

The semantic distinction between `artist` and `originalArtist` is mandatory. The NetEase source artist describes the original recording, while the website artist describes the owner/performer of the new recording.

### Checksums

```json
{
  "algorithm": "sha256",
  "files": {
    "manifest.json": "...",
    "audio/publish.mp3": "...",
    "lyrics/lyrics.lrc": "..."
  }
}
```

The importer verifies all listed files before enabling deployment. Unknown checksum algorithms fail closed.

## Import Experience

The admin upload workspace gains an explicit “Import cover package” action.

The desired interaction is:

1. The administrator chooses or drops a `.coverpkg` file;
2. the browser parses the archive without uploading it;
3. structural, schema, size, path, MIME, and checksum checks run locally;
4. the review form is populated with audio, lyrics, title, performer, original-artist credit, album, and technical details;
5. warnings are shown in context and invalid packages cannot deploy;
6. the administrator may edit public metadata and lyrics without modifying the original package;
7. “Deploy” calls the existing signed upload and playlist update flow;
8. a success result records the package ID and resulting song identity where the current data model permits it.

The importer is a form-prefill and validation layer, not a second upload subsystem.

## Review Screen

The review state should make the following visible before deployment:

- title;
- performer;
- original artist/credit;
- album or collection;
- audio filename, duration, codec, sample rate, channels, and size when available;
- lyrics presence and timed-line count;
- package schema version;
- checksum status;
- duplicate or previously deployed status;
- any editable tags already supported by the admin workspace.

The primary action stays disabled until hard validation succeeds. Non-blocking quality warnings may be acknowledged without rebuilding the package.

## Validation and Security

The package is untrusted input even though it normally comes from the owner's desktop tool.

The importer must:

- allow only the required v1 paths;
- reject absolute paths, drive-letter paths, `..` traversal, symlinks, and ambiguous Unicode path tricks;
- limit archive file count;
- limit compressed size, per-file uncompressed size, and total uncompressed size;
- reject encrypted archives;
- reject nested archives and executable content;
- validate JSON shape before reading nested fields;
- accept only supported schema versions;
- verify declared file paths match the allowlist;
- verify SHA-256 values;
- verify the audio is consistent with the declared MP3 MIME type;
- parse LRC as text with an explicit size cap;
- avoid injecting lyrics or metadata as HTML;
- release object URLs and large buffers when the review is reset;
- never execute package content.

Exact initial limits should be centralized constants and covered by tests. They may be tuned without changing the v1 package semantics.

## Credential Boundary

The package must never contain:

- admin tokens;
- Cloudflare credentials;
- Tencent Cloud credentials;
- R2 credentials or signed URLs;
- NetEase cookies;
- local absolute paths;
- Audacity configuration.

Authentication remains in the existing website admin session. HuangToolbar does not receive website deployment credentials.

## Reuse of Existing Website Code

The implementation should reuse the current admin upload pipeline instead of creating a parallel path.

Relevant current entry points include:

- `src/components/admin/useAdminUploadFlow.ts` for metadata, lyrics, deploy, and persistence orchestration;
- `src/lib/admin-utils.ts` and `persistSongAssetToLibrary` for saving the uploaded asset to the library;
- the current signed upload and ETag-aware playlist history mechanisms.

The package parser should produce an adapter object that can populate the current upload state. Network and persistence behavior should continue through the existing flow.

Suggested internal boundary:

```ts
type ImportedCoverPackage = {
  schemaVersion: 1
  packageId: string
  projectId: string
  audioFile: File
  lyricsText: string
  metadata: {
    title: string
    artist: string
    originalArtist: string
    album?: string
    credit?: string
  }
  validation: {
    errors: PackageIssue[]
    warnings: PackageIssue[]
  }
}
```

The adapter type is internal and may evolve. The archive layout and manifest meanings are the compatibility contract.

## Duplicate and Retry Behavior

Importing or deploying the same package twice must be understandable and safe.

- Re-importing the same file before deployment should replace the current review state cleanly;
- `packageId` is the primary exact-duplicate signal;
- `projectId` plus audio checksum can identify another build of the same local project;
- a failed upload retry must reuse current upload safeguards and must not silently create duplicate playlist entries;
- an already deployed package should show a warning and link or identify the existing item when possible;
- choosing to publish a revised version remains an explicit administrator action.

Version history should be introduced only after the current song model has a clear ownership and migration plan. It is not required to ship the first importer.

## Recording Workspace Transition

The existing full-recording direction should be retired carefully rather than deleted blindly.

Sequence:

1. Add this accepted decision to the existing recording/export draft;
2. implement and validate package import through the current upload workspace;
3. confirm the Creator Note flow does not depend on cover-recording components;
4. remove or hide the full-cover recording entry point;
5. delete unreachable cover-recording code only after dependency and regression checks;
6. retain generic audio preview or MP3 utilities if they still serve Creator Note or package review.

No existing saved recording should be deleted as part of this transition.

## Implementation Phases

### Phase A: Parser and Contract Tests

- Define v1 manifest schema;
- implement safe ZIP inspection;
- validate paths, counts, sizes, JSON, files, and checksums;
- create fixtures for valid, corrupt, malicious, oversized, and unsupported packages;
- map valid packages into an internal adapter.

Acceptance: a valid fixture produces deterministic review data, and every security fixture fails with a precise local error before any network request.

### Phase B: Admin Review Integration

- Add file picker and drag/drop affordance;
- populate existing upload fields;
- display package, audio, lyrics, and credit information;
- allow edits in the review state;
- expose errors and warnings accessibly;
- reset all files, URLs, and buffers reliably.

Acceptance: importing a valid package produces a complete, editable upload review without uploading data.

### Phase C: Deploy and Retry

- Feed imported audio and lyrics into the existing deploy hook;
- persist performer and available credit fields correctly;
- add package-level duplicate warnings;
- exercise signed upload failures, ETag conflicts, and retry behavior;
- verify the published player and lyrics.

Acceptance: a real package can be reviewed, published, found in the library, played, and retried safely after a simulated failure.

### Phase D: Recording UI Cleanup

- Separate Creator Note dependencies from full cover recording;
- retire the superseded entry point;
- remove dead code only after usage search and tests;
- update product, architecture, and roadmap documents.

Acceptance: the admin workspace presents upload/package import as the cover publication path, Creator Note still works, and no inaccessible recordings or regressions are introduced.

## Test Matrix

At minimum, cover:

- valid v1 package;
- missing manifest;
- unsupported schema version;
- malformed JSON;
- missing audio or lyrics;
- wrong MIME/extension combination;
- checksum mismatch;
- duplicate paths;
- `../` traversal and absolute paths;
- symlink entry;
- nested archive;
- excessive file count;
- excessive compressed or uncompressed size;
- invalid UTF-8 or oversized lyrics;
- LRC timestamps beyond audio duration as a warning;
- performer/original-artist mapping;
- same package imported twice;
- deploy failure followed by retry;
- playlist ETag conflict;
- object URL cleanup;
- mobile and keyboard access to the review flow.

## Non-Goals

The first implementation does not:

- record a complete cover in the browser;
- perform vocal separation;
- edit or mix multitrack audio;
- upload `.ncm`, `.aup3`, stems, takes, or lossless masters;
- automatically deploy without administrator review;
- give HuangToolbar cloud credentials;
- synchronize an Audacity project through the website;
- add a general-purpose ZIP browser;
- redesign the entire song data model before package import can work.

## End-to-End Acceptance

The feature is complete when one real Audacity-produced cover can follow this path:

1. HuangToolbar builds a v1 `.coverpkg` containing only the allowed files;
2. Sonic IDE parses it locally and verifies every checksum;
3. the review shows the cover performer separately from the original artist;
4. the administrator can edit metadata and lyrics;
5. deployment uses the existing signed upload and playlist persistence flow;
6. the published song plays and timed lyrics render correctly;
7. repeating or retrying the operation does not silently create an unintended duplicate;
8. no local source path, credential, stem, take, Audacity project, or master file reaches the upload request.

## Decision Record

- D-001: Full cover recording belongs in Audacity, not Sonic IDE.
- D-002: HuangToolbar owns the explicit handoff artifact.
- D-003: `.coverpkg` v1 is minimal and allowlisted.
- D-004: The website remains the only holder of deployment authority.
- D-005: `artist` is the new performer; `originalArtist` is attribution.
- D-006: Package import adapts to the existing upload flow instead of replacing it.
