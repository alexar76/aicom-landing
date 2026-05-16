/**
 * After generation: probe external image URLs (Unsplash, etc.).
 * Broken links are stripped; a decorative hero SVG layer is injected when needed.
 */

const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_URLS = 24;

/** @param {string} raw */
function escapeRegExp(raw) {
  return raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** @param {string} url */
function isCheckableExternalUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} html
 * @returns {string[]}
 */
export function extractExternalImageUrls(html) {
  /** @type {Set<string>} */
  const found = new Set();

  const push = (raw) => {
    const u = raw.trim();
    if (isCheckableExternalUrl(u)) found.add(u);
  };

  for (const m of html.matchAll(/url\(\s*['"]?(https?:\/\/[^'")]+)['"]?\s*\)/gi)) {
    push(m[1]);
  }
  for (const m of html.matchAll(/\ssrc\s*=\s*['"](https?:\/\/[^'"]+)['"]/gi)) {
    push(m[1]);
  }
  for (const m of html.matchAll(/\ssrcset\s*=\s*['"]([^'"]+)['"]/gi)) {
    for (const part of m[1].split(",")) {
      const u = part.trim().split(/\s+/)[0];
      if (u) push(u);
    }
  }

  return [...found].slice(0, MAX_URLS);
}

function imageCheckTimeoutMs() {
  const n = Number(process.env.AICOM_LANDING_IMAGE_CHECK_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  return Number.isFinite(n) ? Math.min(30_000, Math.max(2_000, Math.floor(n))) : DEFAULT_TIMEOUT_MS;
}

/**
 * @param {Response} res
 */
function responseLooksLikeImage(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct) return res.ok;
  return ct.startsWith("image/") || ct.includes("octet-stream");
}

/**
 * @param {string} url
 * @param {AbortSignal} signal
 */
async function fetchProbe(url, signal) {
  let res = await fetch(url, {
    method: "HEAD",
    signal,
    redirect: "follow",
    headers: { "user-agent": "aicom-landing-image-check/1.0" },
  });
  if (res.status === 405 || res.status === 501 || res.status === 403) {
    res = await fetch(url, {
      method: "GET",
      signal,
      redirect: "follow",
      headers: {
        "user-agent": "aicom-landing-image-check/1.0",
        range: "bytes=0-1023",
      },
    });
  }
  return res;
}

/**
 * @param {string} url
 * @returns {Promise<boolean>} true = keep URL, false = remove + SVG fallback
 */
export async function probeImageUrl(url) {
  const timeoutMs = imageCheckTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchProbe(url, controller.signal);
    if (res.status === 404 || res.status === 410) return false;
    if (res.status >= 400 && res.status < 500) {
      console.warn(`[generate] image URL HTTP ${res.status}, removing — ${url.slice(0, 100)}`);
      return false;
    }
    if (res.status >= 500) {
      console.warn(`[generate] image URL HTTP ${res.status}, keeping (transient) — ${url.slice(0, 80)}`);
      return true;
    }
    if (!res.ok) return true;
    if (!responseLooksLikeImage(res)) {
      console.warn(`[generate] image URL not image/* (${res.headers.get("content-type")}), removing — ${url.slice(0, 80)}`);
      return false;
    }
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[generate] image check inconclusive, keeping URL — ${url.slice(0, 80)} (${msg})`);
    return true;
  } finally {
    clearTimeout(timer);
  }
}

/** Decorative full-bleed SVG (no external deps). */
export function heroSvgFallbackMarkup() {
  return `<svg class="hero-bg hero-bg--repair" aria-hidden="true" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none"><defs><linearGradient id="aicom-hg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366f1" stop-opacity="0.45"/><stop offset="40%" stop-color="#a855f7" stop-opacity="0.32"/><stop offset="100%" stop-color="#ec4899" stop-opacity="0.24"/></linearGradient><radialGradient id="aicom-glow" cx="70%" cy="30%" r="55%"><stop offset="0%" stop-color="#f9a8d4" stop-opacity="0.35"/><stop offset="100%" stop-color="transparent"/></radialGradient><pattern id="aicom-grid" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M56 0H0V56" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern><filter id="aicom-blur"><feGaussianBlur stdDeviation="48"/></filter></defs><rect width="100%" height="100%" fill="url(#aicom-hg)"/><rect width="100%" height="100%" fill="url(#aicom-glow)"/><rect width="100%" height="100%" fill="url(#aicom-grid)"/><path d="M-80 520 Q280 380 620 480 T1200 420 L1520 900 L-80 900 Z" fill="#c084fc" fill-opacity="0.18" filter="url(#aicom-blur)"/><path d="M900 120 Q1100 40 1320 180 T1440 420 L1440 0 L900 0 Z" fill="#818cf8" fill-opacity="0.22"/><path d="M0 720 Q400 640 800 700 T1440 660 L1440 900 L0 900 Z" fill="#f472b6" fill-opacity="0.12"/></svg>`;
}

/**
 * @param {string} html
 * @param {string} url
 */
function stripBrokenUrl(html, url) {
  const e = escapeRegExp(url);
  let out = html;

  out = out.replace(new RegExp(`url\\(\\s*['"]?${e}['"]?\\s*\\)`, "gi"), "none");
  out = out.replace(/background-image:\s*none\s*,\s*/gi, "");
  out = out.replace(/,\s*none(?=\s*[;)])/gi, "");
  out = out.replace(/background-image:\s*none\s*;/gi, "");

  out = out.replace(
    new RegExp(`<img([^>]*?)\\ssrc=['"]${e}['"]([^>]*?)>`, "gi"),
    "<!-- external image removed (unreachable) -->"
  );
  out = out.replace(new RegExp(`\\s*srcset=['"][^'"]*${e}[^'"]*['"]`, "gi"), "");

  return out;
}

/**
 * @param {string} html
 */
function injectHeroSvgFallback(html) {
  if (/hero-bg--repair|class=["'][^"']*hero-bg/.test(html)) return html;

  const svg = heroSvgFallbackMarkup();
  const heroMatch = html.match(/<([a-z]+)([^>]*class=["'][^"']*hero[^"']*["'][^>]*)>/i);
  if (heroMatch) {
    const tag = heroMatch[0];
    const needsPosition = !/position\s*:\s*relative/i.test(heroMatch[2] + html.slice(html.indexOf(tag), html.indexOf(tag) + 400));
    const stylePatch = needsPosition ? ' style="position:relative;overflow:hidden"' : "";
    const open = tag.endsWith("/>") ? tag : tag.replace(/>$/, `${stylePatch}>`);
    return html.replace(tag, `${open}\n${svg}`);
  }
  if (/<header\b/i.test(html)) {
    return html.replace(/<header\b([^>]*)>/i, (m, attrs) => {
      const hasStyle = /style=/i.test(attrs);
      const extra = hasStyle ? "" : ' style="position:relative;overflow:hidden"';
      return `<header${attrs}${extra}>\n${svg}`;
    });
  }
  return html.replace(/<body\b([^>]*)>/i, (m, attrs) => `<body${attrs}>\n${svg}`);
}

/**
 * @param {string} html
 * @returns {Promise<string>}
 */
export async function repairBrokenExternalImages(html) {
  if (process.env.AICOM_LANDING_SKIP_IMAGE_CHECK === "true") return html;

  const urls = extractExternalImageUrls(html);
  if (!urls.length) return html;

  /** @type {Map<string, boolean>} */
  const ok = new Map();
  await Promise.all(
    urls.map(async (url) => {
      const valid = await probeImageUrl(url);
      ok.set(url, valid);
    })
  );

  let repaired = html;
  let removed = 0;
  for (const url of urls) {
    if (ok.get(url)) continue;
    removed++;
    console.warn(`[generate] unreachable image URL (${removed}), removing — ${url.slice(0, 100)}`);
    repaired = stripBrokenUrl(repaired, url);
  }

  if (removed > 0) {
    repaired = injectHeroSvgFallback(repaired);
    console.warn(`[generate] injected SVG hero fallback after ${removed} broken image URL(s)`);
  }

  return repaired;
}
