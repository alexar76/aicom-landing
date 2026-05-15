import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { complete, extractJsonObject } from "../llm/provider.js";
import { architectSystem, architectUser, developerSystem, developerUser } from "../llm/prompt.js";
import { applyBadgeToHtml } from "./badgeConfig.mjs";
import { getDefaultUiLocale, normalizeUiLocale } from "./uiLocale.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = join(__dirname, "..");

export function hashPickIndex(str, n) {
  const h = createHash("sha256").update(str).digest();
  let x = 0;
  for (let i = 0; i < 4; i++) x = (x << 8) | h[i];
  return Math.abs(x) % n;
}

export async function loadPresets(rootDir = PACKAGE_ROOT) {
  const raw = await readFile(join(rootDir, "styles", "presets.json"), "utf8");
  const list = JSON.parse(raw);
  if (!Array.isArray(list)) throw new Error("presets.json must be an array");
  return list;
}

export function pickPreset(presets, styleId, userPrompt) {
  if (styleId) {
    const p = presets.find((x) => x.id === styleId);
    if (!p) {
      const ids = presets.map((x) => x.id).join(", ");
      throw new Error(`Unknown style id "${styleId}". Known: ${ids}`);
    }
    return p;
  }
  return presets[hashPickIndex(userPrompt || "default", presets.length)];
}

/**
 * @param {{ userPrompt: string, styleId?: string|null, uiLocale?: string|null, rootDir?: string }} opts
 * @returns {Promise<{ html: string, architecture: object, stylePreset: object }>}
 */
export async function generateLanding(opts) {
  const { userPrompt, styleId = null, uiLocale = null, rootDir = PACKAGE_ROOT } = opts;
  const trimmed = (userPrompt || "").trim();
  if (!trimmed) throw new Error("Prompt is empty");
  const locale = normalizeUiLocale(uiLocale ?? getDefaultUiLocale());

  const presets = await loadPresets(rootDir);
  const stylePreset = pickPreset(presets, styleId, trimmed);

  const archRaw = await complete({
    system: architectSystem(),
    user: architectUser({ userPrompt: trimmed, stylePreset, uiLocale: locale }),
    maxTokens: 2048,
    temperature: 0.55,
    timeoutMs: 90_000,
  });
  const architecture = extractJsonObject(archRaw);

  const devRaw = await complete({
    system: developerSystem(),
    user: developerUser({ userPrompt: trimmed, architecture, uiLocale: locale }),
    maxTokens: 12000,
    temperature: 0.42,
    timeoutMs: 180_000,
  });
  let { html } = extractJsonObject(devRaw);
  if (typeof html !== "string" || !html.includes("<html")) {
    throw new Error('Developer output must be JSON with string field "html" containing <html');
  }
  html = applyBadgeToHtml(html);

  return { html, architecture, stylePreset };
}
