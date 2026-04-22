# Sonic IDE

Sonic IDE is an IDE-inspired personal music portfolio and personal player. It presents songs as files, lyrics as editable text, and playback controls as a terminal-like runtime panel.

The product has two roles at the same time:

- A portfolio for original work and self-uploaded audio assets
- A personal player for songs the owner wants to keep and listen to inside the same interface

Part of the library is pulled from Cloudflare R2 and managed by the owner. Another part represents songs the owner chooses to upload for personal listening. The current app already supports playback, lyrics, admin upload basics, playlist editing, in-browser recording, and a first browser-side MP3 export flow. It will continue expanding toward stronger backend media handling and CI/CD.

## Product Direction

- Keep the core identity as a music player, not a generic IDE mockup
- Treat the fake IDE shell as the product language for browsing, playback, metadata, and lyrics
- Support both portfolio tracks and personally uploaded listening tracks in one library model
- Grow the admin area into a full audio management workspace, including upload and future recording/export workflows

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
- Responsive layouts for desktop, mobile portrait, and mobile landscape
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

- The app still uses a playlist-shaped library model rather than a richer media catalog.
- Recording and MP3 export exist, but the workflow is still narrow: export currently targets newly recorded client-side audio rather than all managed tracks.
- The recording spec still needs a final decision on draft vs publish behavior and whether recording/export states should be unified more explicitly in the UI model.
- CI/CD automation and merge gates are still documented goals rather than implemented project infrastructure.
- Backend media responsibilities are still lightweight and should be separated more clearly as recording and export flows grow.
