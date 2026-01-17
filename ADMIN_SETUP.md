# Admin System Setup Guide

## Environment Variables

Add the following variables to your `.env.local` file:

```env
# Admin Authentication
ADMIN_SECRET=your-secret-key-here-minimum-32-characters-recommended

# Base URL for magic links (optional, defaults to http://localhost:3000)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name
```

## Generating Admin Magic Links

To generate a magic link for admin access:

```bash
pnpm gen-token
```

This will:
1. Read `ADMIN_SECRET` and `NEXT_PUBLIC_BASE_URL` from `.env.local`
2. Generate a JWT token valid for 1 hour
3. Print a magic link in the format: `${BASE_URL}/admin?token=${jwt}`

## How It Works

1. **Token Generation**: Run `pnpm gen-token` to generate a signed JWT token
2. **Magic Link**: Click the generated link or visit `/admin?token=<jwt>`
3. **Middleware Verification**: The middleware verifies the JWT token
4. **Cookie Setting**: If valid, a secure `admin_session` cookie is set
5. **Access Granted**: Subsequent requests to `/admin` or `/api/admin` are authenticated via the cookie

## Protected Routes

The following routes are protected by authentication:
- `/admin/*` - Admin pages
- `/api/admin/*` - Admin API endpoints

## Security Notes

- Tokens expire after 1 hour
- Cookies are `httpOnly` and `secure` (in production)
- The `ADMIN_SECRET` should be a strong, random string (minimum 32 characters recommended)
- Never commit `.env.local` to version control
