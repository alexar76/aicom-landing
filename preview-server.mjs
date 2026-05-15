#!/usr/bin/env node
/**
 * Minimal local UI: one page, prompt → generate → iframe preview + ZIP download.
 * No admin UI. No AI-Factory Docker/code sandbox — preview HTML is untrusted; isolate via iframe sandbox + CSP (use on localhost / trusted network).
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { generateLanding, loadPresets, ModelOutputError } from "./lib/generate.mjs";
import { zipOneStored } from "./lib/zipStored.mjs";
import { loadDotEnv } from "./lib/loadEnv.mjs";
import { getBadgeConfig } from "./lib/badgeConfig.mjs";
import { normalizeBasePath, resolveRequestPath } from "./lib/basePath.mjs";
import {
  getDefaultUiLocale,
  getUiStrings,
  resolveUiLocale,
  SUPPORTED_UI_LOCALES,
} from "./lib/uiLocale.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
loadDotEnv(ROOT);
const PUBLIC_DIR = join(ROOT, "public");
const BASE_PATH = normalizeBasePath(process.env.AICOM_LANDING_BASE_PATH);

const TTL_MS = 2 * 60 * 60 * 1000;
const MAX_SESSIONS = 80;
/** @type {Map<string, { html: string, created: number }>} */
const sessions = new Map();

/** Responses allowed per client IP per window (0 disables). */
const RATE_LIMIT_MAX = Math.max(0, Number(process.env.AICOM_LANDING_RATE_LIMIT ?? 20));
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
/** @type {Map<string, number[]>} */
const rateBuckets = new Map();

const BASE_SECURITY_HEADERS = /** @type {const} */ ({
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
});

/** CSP for the generator shell (`public/index.html`). */
const APP_PAGE_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** CSP for LLM-generated preview HTML (defense in depth; scripts still allowed). */
const PREVIEW_PAGE_CSP = [
  "default-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval'",
  "style-src 'unsafe-inline'",
  "img-src * data: blob: https: http:",
  "font-src * data: https: http:",
  "media-src * data: blob: https: http:",
  "connect-src *",
  "form-action *",
  "object-src 'none'",
].join("; ");

function pruneSessions() {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.created > TTL_MS) sessions.delete(id);
  }
  while (sessions.size > MAX_SESSIONS) {
    const oldest = [...sessions.entries()].sort((a, b) => a[1].created - b[1].created)[0];
    if (oldest) sessions.delete(oldest[0]);
    else break;
  }
}

/**
 * @param {import("node:http").IncomingMessage} req
 * @returns {string}
 */
function clientIp(req) {
  if (process.env.AICOM_LANDING_TRUST_PROXY === "true") {
    const xf = req.headers["x-forwarded-for"];
    if (typeof xf === "string" && xf.trim()) {
      const first = xf.split(",")[0].trim();
      if (first) return first;
    }
  }
  return req.socket.remoteAddress || "unknown";
}

/**
 * @param {string} ip
 * @returns {boolean} true if rate-limited
 */
function rateLimitExceeded(ip) {
  if (!RATE_LIMIT_MAX) return false;
  const now = Date.now();
  let hits = rateBuckets.get(ip) || [];
  hits = hits.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(ip, hits);
  return false;
}

/**
 * Host header may include a port (e.g. `example.com:443`); Origin often omits default ports.
 * Compare hostnames only so same-origin checks still pass behind strict proxies.
 * @param {string} hostHeader
 */
function hostHeaderToHostname(hostHeader) {
  const raw = hostHeader.trim().split(",")[0].trim();
  if (!raw) return "";
  try {
    return new URL(`http://${raw}`).hostname.toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

/**
 * @param {string} urlStr
 */
function urlToHostname(urlStr) {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Same-origin guard for POST /api/generate (CSRF).
 * @param {import("node:http").IncomingMessage} req
 */
function isAllowedSameOrigin(req) {
  const hostHdr = req.headers.host;
  if (!hostHdr || typeof hostHdr !== "string") return false;
  const expectedHostname = hostHeaderToHostname(hostHdr);

  const origin = req.headers.origin;
  if (origin && typeof origin === "string") {
    const oh = urlToHostname(origin);
    if (oh) return oh === expectedHostname;
  }

  const referer = req.headers.referer;
  if (referer && typeof referer === "string") {
    const rh = urlToHostname(referer);
    if (rh) return rh === expectedHostname;
  }

  return false;
}

/**
 * @param {import("node:http").ServerResponse} res
 * @param {number} code
 * @param {Record<string, unknown>} obj
 * @param {import("node:http").OutgoingHttpHeaders} [extra]
 */
function json(res, code, obj, extra = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    ...BASE_SECURITY_HEADERS,
    ...extra,
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function badRequest(res, msg) {
  json(res, 400, { error: msg });
}

async function handleApiGenerate(req, res) {
  if (!isAllowedSameOrigin(req)) {
    json(res, 403, { error: "Cross-origin request rejected (invalid Origin/Referer)." });
    return;
  }
  const ip = clientIp(req);
  if (rateLimitExceeded(ip)) {
    json(res, 429, { error: "Too many generate requests. Wait and try again." });
    return;
  }

  if (req.headers["content-type"]?.split(";")[0]?.trim() !== "application/json") {
    badRequest(res, "Content-Type must be application/json");
    return;
  }
  const chunks = [];
  let n = 0;
  const maxBody = 48_000;
  for await (const chunk of req) {
    n += chunk.length;
    if (n > maxBody) {
      badRequest(res, "Body too large");
      return;
    }
    chunks.push(chunk);
  }
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    badRequest(res, "Invalid JSON");
    return;
  }
  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  if (!prompt.trim()) {
    badRequest(res, "Prompt is required");
    return;
  }
  const style = body.style == null || body.style === "" ? null : String(body.style);
  const uiLocale =
    body.ui_locale != null && String(body.ui_locale).trim()
      ? String(body.ui_locale)
      : getDefaultUiLocale();

  pruneSessions();
  const t0 = Date.now();
  try {
    const { html, stylePreset } = await generateLanding({
      userPrompt: prompt,
      styleId: style,
      uiLocale,
      rootDir: ROOT,
    });
    const id = randomBytes(12).toString("hex");
    sessions.set(id, { html, created: Date.now() });
    json(res, 200, {
      id,
      styleId: stylePreset.id,
      seconds: ((Date.now() - t0) / 1000).toFixed(1),
    });
  } catch (e) {
    console.error("[generate]", e);
    const msg =
      e instanceof ModelOutputError ? e.message : "Generation failed. Check server logs if this persists.";
    json(res, 500, { error: msg });
  }
}

async function handleStatic(req, res) {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  const pathname = resolveRequestPath(url.pathname, BASE_PATH);
  if (pathname === "/api/config" && req.method === "GET") {
    const locale = resolveUiLocale(url.searchParams.get("lang"));
    json(res, 200, {
      ui_locale: locale,
      supported_locales: [...SUPPORTED_UI_LOCALES],
      strings: getUiStrings(locale),
    });
    return;
  }
  if (pathname === "/" || pathname === "/index.html") {
    const locale = resolveUiLocale(url.searchParams.get("lang"));
    let html = await readFile(join(PUBLIC_DIR, "index.html"), "utf8");
    html = html.replace(
      /<head>/i,
      `<head>\n  <script>window.__AICOM_BASE__=${JSON.stringify(BASE_PATH)};</script>`
    );
    html = html.replace(/<html\s+lang="[^"]*"/, `<html lang="${locale}" data-ui-locale="${locale}"`);
    res.writeHead(200, {
      ...BASE_SECURITY_HEADERS,
      "Content-Security-Policy": APP_PAGE_CSP,
      "content-type": "text/html; charset=utf-8",
    });
    res.end(html);
    return;
  }
  if (pathname === "/api/presets" && req.method === "GET") {
    const presets = await loadPresets(ROOT);
    json(
      res,
      200,
      presets.map((p) => ({ id: p.id, title: p.title }))
    );
    return;
  }
  res.writeHead(404, BASE_SECURITY_HEADERS);
  res.end("Not found");
}

function main() {
  const host = process.env.AICOM_LANDING_HOST || "127.0.0.1";
  const port = Number(process.env.AICOM_LANDING_PORT || process.env.PORT || 3847);

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      const path = resolveRequestPath(url.pathname, BASE_PATH);

      if (req.method === "OPTIONS") {
        res.writeHead(204, BASE_SECURITY_HEADERS);
        res.end();
        return;
      }

      if (req.method === "POST" && path === "/api/generate") {
        await handleApiGenerate(req, res);
        return;
      }

      if (req.method === "GET" && path.startsWith("/preview/")) {
        const id = path.slice("/preview/".length).replace(/[^a-f0-9]/g, "");
        const s = sessions.get(id);
        if (!s) {
          res.writeHead(404, { ...BASE_SECURITY_HEADERS, "content-type": "text/plain; charset=utf-8" });
          res.end("Not found or expired");
          return;
        }
        res.writeHead(200, {
          ...BASE_SECURITY_HEADERS,
          "Content-Security-Policy": PREVIEW_PAGE_CSP,
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        });
        res.end(s.html);
        return;
      }

      if (req.method === "GET" && path.startsWith("/download/") && path.endsWith(".zip")) {
        const id = path.slice("/download/".length, -".zip".length).replace(/[^a-f0-9]/g, "");
        const s = sessions.get(id);
        if (!s) {
          res.writeHead(404, { ...BASE_SECURITY_HEADERS, "content-type": "text/plain; charset=utf-8" });
          res.end("Not found or expired");
          return;
        }
        const zipBuf = zipOneStored("index.html", s.html);
        res.writeHead(200, {
          ...BASE_SECURITY_HEADERS,
          "content-type": "application/zip",
          "content-disposition": 'attachment; filename="landing.zip"',
          "content-length": zipBuf.length,
          "cache-control": "no-store",
        });
        res.end(zipBuf);
        return;
      }

      if (req.method === "GET") {
        await handleStatic(req, res);
        return;
      }

      res.writeHead(405, BASE_SECURITY_HEADERS);
      res.end("Method not allowed");
    } catch (e) {
      console.error("[server]", e);
      res.writeHead(500, { ...BASE_SECURITY_HEADERS, "content-type": "text/plain; charset=utf-8" });
      res.end("Internal server error");
    }
  });

  server.listen(port, host, () => {
    const ui = getDefaultUiLocale();
    const badge = getBadgeConfig();
    const baseSuffix = BASE_PATH || "/";
    console.log(`aicom landing preview → http://${host}:${port}${baseSuffix}`);
    if (BASE_PATH) {
      console.log(`Base path: set AICOM_LANDING_BASE_PATH=${BASE_PATH} (reverse proxy must expose this URL prefix)`);
    }
    console.log(`UI locale: ${ui} (set AICOM_LANDING_UI_LOCALE or ?lang=ru|es)`);
    console.log(
      badge.enabled
        ? `Badge: "${badge.label}" → ${badge.url}`
        : "Badge: disabled (AICOM_LANDING_BADGE_ENABLED=false)"
    );
    if (RATE_LIMIT_MAX > 0) {
      console.log(`Rate limit: ${RATE_LIMIT_MAX} POST /api/generate per IP / ${RATE_LIMIT_WINDOW_MS / 60000} min (AICOM_LANDING_RATE_LIMIT)`);
    }
    if (host === "0.0.0.0") {
      console.warn(
        "\n⚠️  Bound to 0.0.0.0 — reachable on every interface. No built-in auth or HTTPS; API keys live in the server env. Use only on trusted networks, behind a reverse proxy + TLS + auth, or switch to 127.0.0.1.\n"
      );
    }
    console.log("Open in browser, enter a prompt, Generate. Ctrl+C to stop.");
  });
}

main();
