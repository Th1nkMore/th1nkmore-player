# Sonic IDE

Sonic IDE is an IDE-inspired personal cover portfolio, audio journal, and single-owner player. Songs appear as files, lyrics as editor content, and playback as a terminal-like runtime. The product is optimized for one owner and public listeners rather than positioned as a general-purpose music-source platform.

The current public app already supports library browsing, playback, queues, synchronized lyrics, metadata, responsive layouts, and localization. The authenticated admin workspace supports uploads, playlist editing, lyric management, in-browser recording, and a first browser-side MP3 export flow.

The next product direction adds a narrative layer to each full cover recording. A track can include a Creator Note (shown as “翻唱者说” in the relevant UI) made from personal writing and an optional spoken recording. The spoken note is supporting editorial content, not another song: it never enters the queue and never plays at the same time as the cover recording.

## Product Direction

- Keep the core identity as a personal cover portfolio and audio journal, with the player as its delivery surface
- Treat the IDE shell as the product language without carrying over confusing IDE semantics
- Make each public track shareable as a standalone work containing the cover, lyrics, and Creator Note
- Keep full cover recordings and spoken Creator Note recordings as separate audio roles with one shared audio-focus policy
- Preserve a single-owner workflow instead of adding multi-user, marketplace, or arbitrary music-source features
- Add curated per-track visual themes only after the content and sharing model is stable

See the documentation baseline in [`docs/`](docs/README.md).

Current planning highlights:

- Product positioning: [`docs/product/positioning.md`](docs/product/positioning.md)
- Library model: [`docs/product/library-model.md`](docs/product/library-model.md)
- Branching and release: [`docs/process/branching-release.md`](docs/process/branching-release.md)
- Implementation plan: [`docs/roadmap/implementation-plan.md`](docs/roadmap/implementation-plan.md)
- Recording and export draft: [`docs/specs/recording-export.md`](docs/specs/recording-export.md)

## Core Features

- IDE-style music browsing with album folders, queue management, inspector metadata, and terminal-like playback controls
- LRC lyric parsing with active-line highlighting, seeking by line number, and auto-scroll during playback
- Responsive layouts for desktop, mobile portrait, and mobile landscape, including swipe paging synchronized with mobile bottom navigation
- Localized routes with `en`, `zh`, `ja`, and `de`
- Admin upload flow with signed R2 uploads, playlist editing, and NetEase lyric import
- Track classification metadata for portfolio vs personal, source type, visibility, and asset status
- Admin-only recording workspace with microphone capture, preview, retry, save-to-library, and upload handoff
- Browser-side MP3 export for newly recorded audio

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand
- Howler
- next-intl
- Cloudflare R2 via AWS SDK v3
- Biome + Husky + lint-staged

## Development

```bash
pnpm install
pnpm dev
```

App routes:

- `/en`, `/zh`, `/ja`, `/de`: public app
- `/admin/login`: admin sign-in page

## Environment Variables

Create `.env.local` with:

```env
ADMIN_SECRET=your-secret-key-here-minimum-32-characters-recommended
ADMIN_PASSWORD=choose-a-long-random-admin-password
NEXT_PUBLIC_ASSET_BASE_URL=https://your-public-assets-domain.example.com
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-public-assets-domain.example.com
PLAYLIST_PUBLIC_URL=https://your-public-assets-domain.example.com
```

Notes:

- `R2_PUBLIC_URL` is used to build public audio asset URLs after upload.
- `PLAYLIST_PUBLIC_URL` is optional. If omitted, the app falls back to `R2_PUBLIC_URL`.
- `NEXT_PUBLIC_ASSET_BASE_URL` is used by the client to normalize legacy audio URLs.
- The public pages are pre-rendered and refreshed with ISR, so playlist/R2 variables must be present during `pnpm build`, not only at runtime.
- `visibility: private` and `visibility: unlisted` currently remove tracks from the public app and public playlist API. They are not storage-level access control when the R2 manifest and audio objects use public URLs. Use a private bucket plus authenticated or signed delivery before treating those assets as confidential.

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm type-check
pnpm test
```

## Admin Workflow

1. Set `ADMIN_SECRET` and `ADMIN_PASSWORD` in `.env.local`.
2. Open `/admin/login`.
3. Sign in with the configured admin password.
4. Upload an audio file to R2 with a signed URL, or switch to the recording workspace and capture audio in-browser.
5. Set track metadata such as track type, source type, visibility, and asset status.
6. Append or edit entries in the playlist source.
7. Optionally import or normalize lyrics, and export a recording to MP3 from the recording workspace.

## Branching Workflow

- `main`: stable mainline branch
- `live`: deployment branch
- `dev`: integration and acceptance branch
- `feat/*`: feature branches created from `dev`

Required flow:

1. Create every new feature branch from `dev`
2. Complete isolated development and acceptance on `feat/*`
3. Merge accepted feature branches back into `dev`
4. Periodically validate `dev` and merge it into `main`
5. Sync `live` from the validated mainline for deployment

Detailed process: [`docs/process/branching-release.md`](docs/process/branching-release.md)

## Current Gaps

- Public R2 object URLs bypass application-level visibility filtering; true private playback still requires private storage and authenticated delivery.
- The app still uses a playlist-shaped library model rather than a richer media catalog.
- Recording and MP3 export exist, but the workflow is still narrow: export currently targets newly recorded client-side audio rather than all managed tracks.
- Creator Notes, spoken-note recording, track-level share routes, and social metadata are planned but not yet implemented.
- Playback session state is not yet restored across visits, and Media Session integration is not implemented.
- The deployment workflow builds before release, but lint, tests, and frozen-lockfile validation are not yet full remote gates.
- Public R2 URLs still make visibility a discovery control rather than storage-level privacy.
