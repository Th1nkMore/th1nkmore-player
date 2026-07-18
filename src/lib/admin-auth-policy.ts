export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;
export const ADMIN_SESSION_TTL_LABEL = "8H";

export const ADMIN_TOKEN_AUDIENCE = "sonic-ide-admin";
export const ADMIN_TOKEN_ISSUER = "sonic-ide";
export const ADMIN_TOKEN_SUBJECT = "admin";

export const LEGACY_ADMIN_COOKIE_NAME = "admin_session";
export const HOST_ADMIN_COOKIE_NAME = "__Host-admin_session";

export function getAdminSessionCookieName(isSecure: boolean) {
  return isSecure ? HOST_ADMIN_COOKIE_NAME : LEGACY_ADMIN_COOKIE_NAME;
}

export function getSafeAdminNextPath(nextPath?: string) {
  if (!nextPath || nextPath.includes("\\")) return "/admin";
  if (nextPath !== "/admin" && !nextPath.startsWith("/admin/")) {
    return "/admin";
  }

  try {
    const baseUrl = "https://admin.local";
    const parsedUrl = new URL(nextPath, baseUrl);
    if (parsedUrl.origin !== baseUrl) return "/admin";
    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return "/admin";
  }
}
