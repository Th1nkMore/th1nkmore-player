# Admin System Setup Guide

## Environment Variables

Add the following variables to your `.env.local` file:

```env
# Admin Authentication
ADMIN_SECRET=change-me
ADMIN_PASSWORD=change-me
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
3. **Cookie Setting**: Production sets a host-bound `__Host-admin_session` cookie; local HTTP development uses `admin_session`
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

- Sessions and cookies expire together after 8 hours
- Sessions are HS256 JWTs restricted to the Sonic IDE admin issuer, audience, and subject
- Cookies are `httpOnly`, `sameSite=strict`, and `secure` in production; the production cookie also uses the `__Host-` prefix
- `ADMIN_SECRET` must contain at least 32 encoded bytes. Generate it with a cryptographically secure random source; do not use the example value
- `ADMIN_PASSWORD` must contain at least 16 characters. Prefer a generated password of 20 or more characters and do not reuse it elsewhere
- Five failed passwords from one client within 15 minutes block that client for 15 minutes. This limiter is process-local, so keep the application behind Cloudflare and add an edge rate-limit rule for `/api/admin/login`
- Restrict direct access to the origin server so clients cannot forge proxy IP headers to bypass edge controls
- A deployment of this auth policy invalidates older admin sessions; sign in again after release
- Never commit `.env.local` to version control

## Production Release Checklist

- Confirm the production process has compliant `ADMIN_SECRET` and `ADMIN_PASSWORD` values before restart
- Protect the GitHub `live` branch: require a pull request or an explicit release workflow, require the deployment quality-gate check, block force pushes, and restrict who can push
- Keep GitHub Actions credentials in repository or environment secrets, never in tracked files
- Keep the SSH account limited to the application deployment responsibilities
- Add a Cloudflare rate-limit rule for `POST /api/admin/login`; the in-process limiter remains a second layer
