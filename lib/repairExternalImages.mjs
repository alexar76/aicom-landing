/**
 * After generation: probe external image URLs (Unsplash, etc.).
 * Broken links are stripped; a decorative hero SVG layer is injected when needed.
 */

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_URLS = 24;
const MAX_REDIRECTS = 3;

/**
 * Loopback, private, link-local, CGNAT, ULA, multicast, unspecified, documentation —
 * anything that is not a public internet address. The URLs probed here are written by a
 * model steered by an anonymous visitor's brief, so without this the probe was a blind
 * request into the factory host's own network.
 * @param {string} ip
 */
export function isNonPublicAddress(ip) {
  let a = String(ip || "").toLowerCase();
  if (a.startsWith("::ffff:")) a = a.slice(7);
  if (isIP(a) === 4) {
    const [p, q] = a.split(".").map(Number);
    return p === 0 || p === 10 || p === 127 || p >= 224 ||
      (p === 100 && q >= 64 && q <= 127) || (p === 169 && q === 254) ||
      (p === 172 && q >= 16 && q <= 31) || (p === 192 && q === 168) ||
      (p === 192 && q === 0) || (p === 198 && (q === 18 || q === 19)) ||
      a.startsWith("192.0.2.") || a.startsWith("198.51.100.") || a.startsWith("203.0.113.");
  }
  if (isIP(a) === 6) {
    return a === "::" || a === "::1" || a.startsWith("fc") || a.startsWith("fd") ||
      a.startsWith("fe8") || a.startsWith("fe9") || a.startsWith("fea") || a.startsWith("feb") ||
      a.startsWith("ff") || a.startsWith("64:ff9b:") || a.startsWith("2002:") || a.startsWith("2001:db8:");
  }
  return true;
}

/** @param {string} hostname */
async function hostIsPublic(hostname) {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) return !isNonPublicAddress(host);
  try {
    const addrs = await lookup(host, { all: true });
    return addrs.length > 0 && addrs.every((r) => !isNonPublicAddress(r.address));
  } catch {
    return false;
  }
}

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
async function fetchOnePublic(url, init) {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const u = new URL(current);
    if ((u.protocol !== "http:" && u.protocol !== "https:") || !(await hostIsPublic(u.hostname))) {
      return null;
    }
    // Redirects are followed by hand so every hop's host is checked, not just the first.
    const res = await fetch(current, { ...init, redirect: "manual" });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current).toString();
      continue;
    }
    return res;
  }
  return null;
}

async function fetchProbe(url, signal) {
  let res = await fetchOnePublic(url, {
    method: "HEAD",
    signal,
    headers: { "user-agent": "aicom-landing-image-check/1.0" },
  });
  if (res && (res.status === 405 || res.status === 501 || res.status === 403)) {
    res = await fetchOnePublic(url, {
      method: "GET",
      signal,
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
    if (res === null) {
      console.warn(`[generate] image URL is not a public address, removing — ${url.slice(0, 80)}`);
      return false;
    }
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

/**
 * @param {string} [html]
 * @returns {string[]}
 */
function paletteFromHtml(html) {
  /** @type {string[]} */
  const out = [];
  const seen = new Set();
  for (const m of (html || "").matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const c = m[0].toLowerCase();
    if (seen.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= 4) break;
  }
  return out.length >= 2 ? out : ["#f5e6ef", "#e8c4d8", "#c9a0b8", "#8b5e7c"];
}

/** Decorative full-bleed SVG (no external deps). Uses page palette when available. */
export function heroSvgFallbackMarkup(html = "") {
  const [c0, c1, c2, c3] = paletteFromHtml(html);
  return `<svg class="hero-bg hero-bg--repair" aria-hidden="true" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none"><defs><linearGradient id="aicom-hg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c0}" stop-opacity="0.5"/><stop offset="45%" stop-color="${c1}" stop-opacity="0.35"/><stop offset="100%" stop-color="${c2}" stop-opacity="0.28"/></linearGradient><radialGradient id="aicom-glow" cx="72%" cy="28%" r="58%"><stop offset="0%" stop-color="${c3}" stop-opacity="0.4"/><stop offset="100%" stop-color="transparent"/></radialGradient><pattern id="aicom-grid" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M56 0H0V56" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/></pattern><filter id="aicom-blur"><feGaussianBlur stdDeviation="52"/></filter></defs><rect width="100%" height="100%" fill="url(#aicom-hg)"/><rect width="100%" height="100%" fill="url(#aicom-glow)"/><rect width="100%" height="100%" fill="url(#aicom-grid)"/><path d="M-80 520 Q280 380 620 480 T1200 420 L1520 900 L-80 900 Z" fill="${c1}" fill-opacity="0.2" filter="url(#aicom-blur)"/><path d="M900 120 Q1100 40 1320 180 T1440 420 L1440 0 L900 0 Z" fill="${c2}" fill-opacity="0.24"/><path d="M0 720 Q400 640 800 700 T1440 660 L1440 900 L0 900 Z" fill="${c0}" fill-opacity="0.14"/></svg>`;
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

  const svg = heroSvgFallbackMarkup(html);
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
