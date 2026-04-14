const PLAYLIST_FILE_NAME = "playlist.json";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getPublicBaseUrl(): string | null {
  const explicitBaseUrl =
    process.env.PLAYLIST_PUBLIC_URL ||
    process.env.R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_ASSET_BASE_URL;

  if (explicitBaseUrl) {
    return trimTrailingSlash(explicitBaseUrl);
  }

  if (process.env.R2_ACCOUNT_ID && process.env.R2_BUCKET_NAME) {
    return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}`;
  }

  return null;
}

export function getPublicPlaylistUrl(): string | null {
  const baseUrl = getPublicBaseUrl();
  return baseUrl ? `${baseUrl}/${PLAYLIST_FILE_NAME}` : null;
}

export function buildPublicAssetUrl(key: string): string | null {
  const baseUrl = getPublicBaseUrl();
  if (!baseUrl) return null;

  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl}/${encodedKey}`;
}
