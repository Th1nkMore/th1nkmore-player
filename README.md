# Sonic IDE

Sonic IDE is a personal music portfolio built as a fake code editor. Songs are presented as files, lyrics render in an editor-like view, and playback controls live in a terminal-style panel.

## Core Features

- IDE-style music browsing with album folders, queue management, inspector metadata, and terminal-like playback controls
- LRC lyric parsing with active-line highlighting, seeking by line number, and auto-scroll during playback
- Responsive layouts for desktop, mobile portrait, and mobile landscape
- Localized routes with `en`, `zh`, `ja`, and `de`
- Admin upload flow with signed R2 uploads, playlist editing, and NetEase lyric import

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
- `/admin?token=...`: admin panel via magic link

## Environment Variables

Create `.env.local` with:

```env
ADMIN_SECRET=your-secret-key-here-minimum-32-characters-recommended
NEXT_PUBLIC_BASE_URL=http://localhost:3000
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
pnpm gen-token
```

## Admin Workflow

1. Run `pnpm gen-token` to generate an admin magic link.
2. Open `/admin?token=...`.
3. Upload an audio file to R2 with a signed URL.
4. Append or edit entries in `playlist.json`.
5. Optionally import LRC lyrics from a NetEase Music link.

## Current Gaps

- `pnpm type-check` passes, but `pnpm lint` still reports legacy style and complexity issues, especially in `scripts/` and a few core files.
- The project still contains compatibility code for older audio URLs that were generated with an incorrect public host.
