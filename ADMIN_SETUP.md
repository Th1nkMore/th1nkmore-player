# Admin System Setup Guide

## Environment Variables

Add the following variables to your `.env.local` file:

```env
# Admin Authentication
ADMIN_SECRET=your-secret-key-here-minimum-32-characters-recommended
ADMIN_PASSWORD=choose-a-long-random-admin-password
NEXT_PUBLIC_ASSET_BASE_URL=https://your-public-assets-domain.example.com

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-public-assets-domain.example.com
PLAYLIST_PUBLIC_URL=https://your-public-assets-domain.example.com
```

## Signing In

To access the admin area:

```bash
open http://localhost:3000/admin/login
```

Then sign in with the value configured in `ADMIN_PASSWORD`.

## How It Works

1. **Password Check**: Submit the admin password to `/api/admin/login`
2. **Session Signing**: The server signs a JWT session with `ADMIN_SECRET`
3. **Cookie Setting**: A secure `admin_session` cookie is set
4. **Middleware Verification**: The middleware verifies the session cookie
5. **Access Granted**: Subsequent requests to `/admin` or protected `/api/admin` routes are authenticated via the cookie

## Storage Notes

- `R2_PUBLIC_URL` should point to the public asset host or custom domain that serves files from your bucket.
- `PLAYLIST_PUBLIC_URL` can be set separately if `playlist.json` is served from a different public base URL.
- `NEXT_PUBLIC_ASSET_BASE_URL` lets the client normalize legacy audio URLs when older playlist entries still reference the wrong host.

## Protected Routes

The following routes are protected by authentication:
- `/admin/*` - Admin pages
- `/api/admin/*` - Admin API endpoints

## Security Notes

- Sessions expire after 7 days
- Cookies are `httpOnly`, `sameSite=strict`, and `secure` (in production)
- The `ADMIN_SECRET` should be a strong, random string (minimum 32 characters recommended)
- The `ADMIN_PASSWORD` should be a long random password and should not be reused elsewhere
- Never commit `.env.local` to version control
