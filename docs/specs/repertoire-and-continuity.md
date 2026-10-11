# Repertoire, music insights, and playback continuity

The owner can register a song without uploading audio, then link one or more recordings to it. Public browsing remains a library of published playable recordings. Registration is not a claim that the estimated thousand-song repertoire has already been entered.

## Data and counting

- A repertoire entry has a stable ID, title, structured original/source artists, default styles, private tags, optional language and learned date, knowledge (known/learning), optional proficiency (unassessed/comfortable/review), private notes, recording associations, and an archive flag.
- Existing cover recordings seed entries by normalized title/source identity. Learning dates are not inferred and proficiency starts unassessed. Verified collaborator credit lists from the existing library are expanded individually; arbitrary artist/band strings remain intact.
- Knowledge counts active entries explicitly marked known. Recorded/published counts derive from actual recording references; learning and publication are independent.
- Repertoire archiving does not change a recording's publication status. Already recorded/published recordings remain in those insights. Recording publication still follows the existing visibility/ready/playable rules.
- Song counting deduplicates linked recording versions by repertoire ID. Recording counting uses recording IDs. Multiple artists, styles, tags, or language versions can overlap; percentages use the selected population as their denominator.
- Default styles are separate from ordinary tags. Only explicit existing genre tags are used during migration; Cover and Guitar are not guessed as genres. Each recording can inherit styles or specify its own styles.
- Repertoire language describes the owner's registered singing language. Recording insights use each recording's declared primary performed language. Unknown values stay unknown. Supported values include Chinese, Cantonese, English, Japanese, Korean, Spanish, French, German, other, and unspecified.

## Storage and privacy

The private manifest lives outside the deployment checkout: `REPERTOIRE_DATA_DIR`, or the process user's `~/.local/share/sonic-ide` in production. Development uses `~/.local/share/sonic-ide-development`. Local previews and the live server intentionally have separate private lists; the workspace links to the live admin for lasting records. Audio and the existing recording manifest retain their R2 storage behavior.

Writes require the last observed SHA-256 revision, serialize through a process-aware file lock, save a private history snapshot, and atomically rename a new manifest. Files are created with mode 0600 and directories with 0700. Failed/corrupt reads do not replace the list. Locks left by terminated writers can be recovered; live writers are not interrupted. History restoration is revision checked and first backs up the replaced state. Exported JSON backups can be merged back in without removing unrelated entries.

The existing admin session middleware protects `/api/admin/repertoire`, including history. Responses are private/no-store. Public playlist enrichment copies only repertoire ID, structured source artists, and applicable musical styles for already-public playable recordings. It never exposes unrecorded titles, knowledge/proficiency, personal notes, private tags, or learned dates. Source credit text attached to individual recordings remains intact. Saving repertoire metadata invalidates public page/playlist caches.

## Management UI

The admin gains a Repertoire destination with list, insights, and history views. It supports registration, source/style/language filters, 50-row pagination, multiline/tabular import preview, duplicate checks, uncertain same-title review, JSON import/export, and reversible archive/history actions. Drafts are protected on editor close, navigation, logout, and page exit. Loading/unavailable counts are not presented as zero. Fields are disabled during saving.

The existing upload/edit publishing section searches repertoire entries to associate a recording and optionally overrides its styles. Public and private insights share a searchable distribution view with eight initial rows and expansion. The public panel shows source artist, style, language, tag, and actual performance type distributions. Private insights omit performance types for unrecorded entries rather than guessing them.

## Playback memory

The public player saves a versioned browser-local session containing recording IDs, queue IDs, collection order, position, an audio fingerprint, volume, playback order, and save time. It does not duplicate audio URLs, lyrics, or private repertoire metadata. Progress saves are throttled, with immediate saves for structural changes and page lifecycle events; storage failures do not interrupt playback.

Restoration waits for a successful current public playlist read, reconciles IDs against available recordings, preserves zero volume, and restores in a paused state. A visible Continue action resumes after the real audio duration is known. Replaced audio resets its old position; completed/out-of-range positions start at zero. Failed reads retain the previous saved session. Creator Note audio is not restored or queued.

Media Session controls are feature detected and provide current track metadata, play/pause, previous/next and seeking. Pause also pauses spoken Creator Notes, and track navigation returns audio focus to the cover. Physical mobile lock-screen/headset behavior still requires device acceptance; viewport checks are not a substitute.

## Acceptance

Unit and API tests cover private/public projection, two counting methods, collaborator credit handling, style overrides, language unknowns, 1,200-entry import parsing, stable initial revisions, duplicate ownership, invalid dates, conflicts, concurrent writers, orphan locks, backup restoration and playback reconciliation. Browser acceptance covers registration without audio, private note preservation, draft cancellation, import preview, history restore, dimensions/scopes, responsive themes and paused playback restoration. Synthetic acceptance entries are removed afterward; no test audio is published.
