function encodeFilename(filename: string): string {
  try {
    const decoded = decodeURIComponent(filename);
    const reEncoded = encodeURIComponent(decoded);
    if (reEncoded !== filename) {
      return reEncoded;
    }
  } catch {
    const encoded = encodeURIComponent(filename);
    if (encoded !== filename) {
      return encoded;
    }
  }
  return filename;
}

function getClientAssetBaseUrl(): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_ASSET_BASE_URL;
  if (!baseUrl) return null;
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: URL normalization intentionally handles parsed and legacy fallback paths together.
export function fixAudioUrl(audioUrl: string): string {
  let fixedUrl = audioUrl;

  try {
    const url = new URL(fixedUrl);

    if (url.hostname.endsWith(".space.com")) {
      url.hostname = url.hostname.replace(/\.space\.com$/, ".space");
      fixedUrl = url.toString();
    }

    const clientAssetBaseUrl = getClientAssetBaseUrl();
    if (clientAssetBaseUrl && url.hostname === "files.th1nkmore.space") {
      fixedUrl = `${clientAssetBaseUrl}/${url.pathname.replace(/^\/+/, "")}`;
    }

    const pathParts = url.pathname.split("/");
    const filename = pathParts[pathParts.length - 1];
    if (filename) {
      const encodedFilename = encodeFilename(filename);
      if (encodedFilename !== filename) {
        pathParts[pathParts.length - 1] = encodedFilename;
        url.pathname = pathParts.join("/");
        fixedUrl = url.toString();
      }
    }
  } catch {
    const urlMatch = fixedUrl.match(/^(https?:\/\/[^/]+)(\/.+)$/);
    if (urlMatch) {
      const [, base, path] = urlMatch;
      const pathParts = path.split("/");
      const filename = pathParts[pathParts.length - 1];
      if (filename) {
        const encodedFilename = encodeFilename(filename);
        if (encodedFilename !== filename) {
          pathParts[pathParts.length - 1] = encodedFilename;
          fixedUrl = base + pathParts.join("/");
        }
      }
    }
  }
  return fixedUrl;
}
