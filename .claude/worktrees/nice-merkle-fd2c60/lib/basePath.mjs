/**
 * Public URL prefix when the app is mounted under a path (e.g. /landing-page-generation).
 * Empty string means the app is served at the site root (recommended: dedicated subdomain).
 * @param {unknown} raw
 * @returns {string} "" or "/segment/..." without trailing slash
 */
export function normalizeBasePath(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "/") return "";
  let p = s.startsWith("/") ? s : `/${s}`;
  while (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

/**
 * Path for internal routing: strips leading base when the reverse proxy forwards the full URI.
 * If the proxy already strips the prefix, pathname has no base — returned unchanged.
 * @param {string} pathname
 * @param {string} base from {@link normalizeBasePath}
 * @returns {string} path starting with /
 */
export function resolveRequestPath(pathname, base) {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (!base) return p;
  if (p === base) return "/";
  if (p.startsWith(`${base}/`)) {
    const rest = p.slice(base.length);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return p;
}
