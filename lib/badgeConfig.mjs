/**
 * Generated landing footer badge (Powered by …).
 *
 * Env (also pass to Docker with -e or --env-file):
 *   AICOM_LANDING_BADGE_ENABLED=true|false   default: true
 *   AICOM_LANDING_BADGE_URL=https://…        default: https://magic-ai-factory.com/
 *   AICOM_LANDING_BADGE_LABEL=Powered by …   default: Powered by AI-Factory
 */

const DEFAULT_URL = "https://magic-ai-factory.com/";
const DEFAULT_LABEL = "Powered by AI-Factory";
const BADGE_ID = "aifactory-powered-badge";

/**
 * @returns {{ enabled: boolean, url: string, label: string }}
 */
export function getBadgeConfig() {
  const enabled = parseBoolEnv(process.env.AICOM_LANDING_BADGE_ENABLED, true);
  let url = String(process.env.AICOM_LANDING_BADGE_URL ?? DEFAULT_URL).trim();
  let label = String(process.env.AICOM_LANDING_BADGE_LABEL ?? DEFAULT_LABEL).trim();
  if (!url) url = DEFAULT_URL;
  if (!label) label = DEFAULT_LABEL;
  if (enabled && !isHttpUrl(url)) {
    throw new Error(
      `AICOM_LANDING_BADGE_URL must be http:// or https:// when badge is enabled (got: ${url})`
    );
  }
  return { enabled, url, label };
}

/**
 * @param {string | undefined} raw
 * @param {boolean} defaultValue
 */
function parseBoolEnv(raw, defaultValue) {
  if (raw == null || String(raw).trim() === "") return defaultValue;
  const v = String(raw).trim().toLowerCase();
  if (["0", "false", "no", "off", "disabled"].includes(v)) return false;
  if (["1", "true", "yes", "on", "enabled"].includes(v)) return true;
  return defaultValue;
}

/** @param {string} u */
function isHttpUrl(u) {
  return u.startsWith("http://") || u.startsWith("https://");
}

/** @param {string} s */
function escapeHtmlText(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @param {string} s */
function escapeHtmlAttr(s) {
  return escapeHtmlText(s).replace(/'/g, "&#39;");
}

/**
 * @param {{ enabled: boolean, url: string, label: string }} config
 * @returns {string}
 */
export function badgeHtmlSnippet(config) {
  if (!config.enabled) return "";
  const href = escapeHtmlAttr(config.url);
  const text = escapeHtmlText(config.label);
  return (
    `<a id="${BADGE_ID}" href="${href}" target="_blank" rel="noopener noreferrer" ` +
    `style="position:fixed;bottom:16px;right:16px;z-index:999999;padding:8px 12px;` +
    `background:linear-gradient(135deg,#4f46e5,#9333ea);color:#fff;border-radius:999px;` +
    `font:600 12px system-ui,sans-serif;text-decoration:none;` +
    `box-shadow:0 10px 25px rgba(79,70,229,.35);">${text}</a>`
  );
}

const BADGE_RE =
  /<a\b[^>]*\bid\s*=\s*["']aifactory-powered-badge["'][^>]*>[\s\S]*?<\/a>/gi;

/** @param {string} html */
export function stripBadgeFromHtml(html) {
  return html.replace(BADGE_RE, "");
}

/**
 * Inject or replace footer badge before </body>.
 * @param {string} html
 * @param {{ enabled: boolean, url: string, label: string }} [config]
 */
export function applyBadgeToHtml(html, config = getBadgeConfig()) {
  let out = stripBadgeFromHtml(html);
  if (!config.enabled) return out;
  const snippet = badgeHtmlSnippet(config);
  const lower = out.toLowerCase();
  const idx = lower.lastIndexOf("</body>");
  if (idx === -1) return out + "\n" + snippet;
  return out.slice(0, idx) + snippet + "\n" + out.slice(idx);
}
